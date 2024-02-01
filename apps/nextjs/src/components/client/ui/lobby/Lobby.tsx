"use client";

import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { useLobbyStore, usePusher } from "@/components/client/stores";
import {
  HotnColdInstructions,
  LobbySettings,
  PlayersContainer,
} from "@/components/client/ui/lobby";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LobbyEventMap } from "@/lib/types";
import { useUser } from "@clerk/nextjs";
import { Transition } from "@headlessui/react";
import type { PresenceChannel } from "pusher-js";

const MinaStartButton = dynamic(
  () => import("@/components/client/mina/MinaStartButton"),
  {
    ssr: false,
  },
);

function Lobby({
  hostUsername,
  lobbyId,
}: {
  hostUsername: string;
  lobbyId: string;
}) {
  const [toXR, setToXR] = React.useState<boolean>(false);
  const [launchXR, setLaunchXR] = React.useState<boolean>(false);
  const [xrLoaded, setXrLoaded] = React.useState<boolean>(false);
  const [showInstructions, setShowInstructions] =
    React.useState<boolean>(false);
  const [xrSupported, setXRSupported] = useState<boolean>(false);

  const { user, isSignedIn } = useUser();

  const HotnColdGame = dynamic(
    () => import("@/components/client/xr/HotnColdGame"),
    {
      ssr: true,
      loading: ({ isLoading, error }) => {
        isLoading ? setXrLoaded(false) : setXrLoaded(true);

        if (error) {
          throw new Error("Error loading XR component");
        }

        return null;
      },
    },
  );

  const {
    subscribeToChannel,
    activeChannels,
    unsubscribeFromChannel,
    me,
    pusherInitialized,
    initPusher,
  } = usePusher((state) => {
    return {
      subscribeToChannel: state.subscribeToChannel,
      activeChannels: state.activeChannels,
      unsubscribeFromChannel: state.unsubscribeFromChannel,
      me: state.me,
      pusherInitialized: state.pusherInitialized,
      initPusher: state.initPusher,
    };
  });

  const {
    addEventsToPresenceChannel,
    updatePlayer,
    isMinaOn,
    setIsMinaOn,
    setStarting,
    starting,
    players,
  } = useLobbyStore();
  const [lobbyChannel, setLobbyChannel] =
    React.useState<PresenceChannel | null>(null);

  const lobbyEvents: LobbyEventMap = useMemo(() => {
    return {
      "client-ready-toggle": ({
        ready,
        username,
      }: {
        ready: boolean;
        username: string;
      }) => {
        const players = useLobbyStore.getState().players;

        const opponent = players.find((p) => p.username === username);

        if (!opponent) {
          throw new Error("LobbyZ client-ready: Could not find opponent");
        }

        updatePlayer({
          ...opponent,
          ready,
        });
      },
      "client-mina-toggle": ({ minaToggle }: { minaToggle: boolean }) => {
        setIsMinaOn(minaToggle);
      },
      "client-game-started": () => {
        setStarting(true);
        setToXR(true);
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.username, updatePlayer, setIsMinaOn]);

  const presenceChannelName = useMemo(
    () => `presence-lobby-${lobbyId}`,
    [lobbyId],
  );

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    if (!pusherInitialized) {
      initPusher(
        me
          ? {
            userId: me.id,
            username: me.username ?? "",
            imageUrl: me.imageUrl,
          }
          : {
            userId: user.id,
            username: user.username ?? "",
            imageUrl: user.imageUrl,
          },
      );
    }

    if (activeChannels.find((c) => c.name === presenceChannelName)) {
      console.log("already subscribed to presence channel");
      return;
    }

    const channel = subscribeToChannel(presenceChannelName);

    if (!channel) {
      throw new Error(
        `Could not subscribe to presence channel: presence-lobby-${lobbyId}`,
      );
    }
    setLobbyChannel(channel as PresenceChannel);

    addEventsToPresenceChannel(
      presenceChannelName,
      lobbyEvents,
      hostUsername === user.username!,
    );

    return () => {
      unsubscribeFromChannel(presenceChannelName);
      setLobbyChannel(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyId, presenceChannelName, isSignedIn]);

  const [mounted, setMounted] = React.useState(false);
  useEffect(() => {
    if (mounted || !user) {
      return;
    }
    if (players.length === 0) {
      updatePlayer({
        host: user.username === hostUsername,
        ready: false,
        inGame: false,
        username: user.username!,
        id: user.id,
        imageUrl: `/api/imageProxy?url=${encodeURIComponent(user.imageUrl)}`,
      });
    }

    setMounted(true);
  }, [mounted, user, hostUsername, updatePlayer, players]);

  const handleReady = useCallback(
    (username: string) => {
      const player = players.find((p) => p.username === username);

      if (!player) {
        throw new Error("LobbyZ: Could not find player");
      }

      updatePlayer({
        ...player,
        ready: !player.ready,
      });

      lobbyChannel?.trigger("client-ready-toggle", {
        ready: !player.ready,
        username: player.username,
      });
    },
    [updatePlayer, lobbyChannel, players],
  );

  return (
    <>
      {/* Lobby UI */}
      <Transition
        show={!toXR && mounted}
        beforeEnter={() => console.log("transition starting to open")}
        afterEnter={() => console.log("transition opened")}
        beforeLeave={() => console.log("transition starting to close")}
        afterLeave={() => setShowInstructions(true)}
      >
        <Transition.Child
          as={Fragment}
          enter="transform duration-200 transition ease-out-in"
          enterFrom="opacity-50 scale-50"
          enterTo="opacity-100 scale-100"
          leave="transform duration-200 transition ease-in-out"
          leaveFrom="opacity-100 rotate-0 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <PlayersContainer
            players={players}
            handleReady={handleReady}
            starting={starting}
          />
        </Transition.Child>
      </Transition>

      {/* Game Instructions */}
      <Transition show={showInstructions}>
        <Transition.Child
          as={Card}
          enter="transform duration-200 transition ease-out-in"
          enterFrom="opacity-50 scale-50"
          enterTo="opacity-100 scale-100"
          leave="transform duration-200 transition ease-in-out"
          leaveFrom="opacity-100 rotate-0 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <HotnColdInstructions />
        </Transition.Child>
      </Transition>

      {/* Game */}
      {xrLoaded && (
        <HotnColdGame
          launchXR={launchXR}
          xrSupported={xrSupported}
          setXRSupported={setXRSupported}
        />
      )}

      {/* Start and Settings Buttons, always anchored at the bottom */}
      <div className="absolute bottom-16 flex items-center gap-x-12">
        {!starting ? (
          <>
            <Button
              variant="default"
              className="relative"
              disabled={
                useLobbyStore.getState().players.some((p) => !p.ready) ||
                hostUsername !== me?.username ||
                starting
              }
              onClick={() => {
                if (hostUsername === me?.username) {
                  lobbyChannel?.trigger("client-game-started", {
                    starting: true,
                  });
                  setStarting(true);
                  setToXR(true);
                }
              }}
            >
              Start Game
            </Button>
            <LobbySettings
              toXR={toXR}
              isMinaOn={isMinaOn}
              setIsMinaOn={setIsMinaOn}
              isHost={me?.username === hostUsername}
              channel={lobbyChannel}
            />
          </>
        ) : isMinaOn ? (
          <MinaStartButton
            setToXR={setToXR}
          >
            <Button
              variant={"default"}
              onPointerDown={() => setLaunchXR(true)}
              disabled={launchXR || !xrLoaded || !xrSupported}
            >
              {!xrSupported ? "XR Not Supported" : "Launch XR"}
            </Button>
          </MinaStartButton>
        ) : (
          <Button
            variant={"default"}
            onPointerDown={() => setLaunchXR(true)}
            disabled={launchXR || !xrLoaded || !xrSupported}
          >
            {!xrSupported ? "XR Not Supported" : "Launch XR"}
          </Button>
        )}
      </div>
    </>
  );
}

export default Lobby;
