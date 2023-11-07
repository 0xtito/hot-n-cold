"use client";

import React, { useState, useMemo, useContext, createContext } from "react";

import { toast } from "@/components/ui/use-toast";
import { useFriendsChannel } from "@/lib/hooks/useFriendsChannel";
import { ToastAction } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

interface FriendInfo {
  username: string;
  firstName: string | null;
  imageUrl: string;
  id: string;
}

interface Invite {
  sender: FriendInfo;
  gameId: string;
}

type PendingFriendRequests = {
  requestId: number;
  imageUrl: string;
  username: string;
  firstName: string | null;
};

type NotificationType = "PendingFriendRequest" | "GameInvite";

interface BaseNotification {
  type: NotificationType;
}

interface TaggedPendingFriendRequest
  extends PendingFriendRequests,
    BaseNotification {
  type: "PendingFriendRequest";
}

interface TaggedGameInvite extends Invite, BaseNotification {
  type: "GameInvite";
}

type Notification = TaggedPendingFriendRequest | TaggedGameInvite;

interface PusherClientContextValues {
  activeFriends: FriendInfo[];
  pendingFriendRequests: PendingFriendRequests[];
  gameInvites: Invite[];
  allNotifications: Notification[];
}

const PusherClientContext = createContext<PusherClientContextValues>({
  activeFriends: [],
  pendingFriendRequests: [],
  gameInvites: [],
  allNotifications: [],
});

export const useFriendsProvider = () => {
  const context = useContext(PusherClientContext);
  if (!context) {
    throw new Error(
      "useFriendsProvider must be used within a FriendsChannelProvider",
    );
  }
  return context;
};

function FriendsChannelProvider({
  children,
  initFriendsInfo,
  initFriendRequests,
  initGameInvites,
  userId,
}: {
  children: React.ReactNode;
  initFriendsInfo: FriendInfo[];
  initFriendRequests: PendingFriendRequests[];
  initGameInvites: Invite[];
  userId: string;
}) {
  const [activeFriends, setActiveFriends] =
    useState<FriendInfo[]>(initFriendsInfo);
  const [pendingFriendRequests, setPendingFriendRequests] =
    useState<PendingFriendRequests[]>(initFriendRequests);
  const [gameInvites, setGameInvites] = useState<Invite[]>(initGameInvites);

  const router = useRouter();

  // const [gameInvites, setGameInvites] = useState<Invite[]>([]);

  // const handleJoinGame = (gameId: string) => {
  //   console.log("join game", gameId);
  //   router.push(`/lobby/${gameId}`);
  // };

  useFriendsChannel({
    "friend-added": (data) => {
      console.log("friend added", data);
      setPendingFriendRequests((prev) =>
        prev.filter((request) => request.username !== data.username),
      );
      setActiveFriends((prev) => {
        return [
          ...prev,
          {
            username: data.username,
            firstName: data.firstName,
            imageUrl: data.imageUrl,
            id: data.id,
          },
        ];
      });
    },
    "friend-deleted": (data) => {
      console.log("friend deleted", data);
      setActiveFriends((prev) =>
        prev.filter((friend) => friend.id !== data.id),
      );
      toast({
        title: "Friend Deleted!",
        description: `${data.username} has been removed from your friends list.`,
        variant: "destructive",
        duration: 5000,
      });
    },
    "friend-request-pending": (data) => {
      if (!data.requestId) {
        throw new Error("No request id found");
      }

      toast({
        title: "New Friend Request!",
        description: `Sent from ${data.username}`,
        duration: 5000,
      });

      setPendingFriendRequests((prev) => [
        ...prev,
        {
          username: data.username,
          firstName: data.firstName,
          imageUrl: data.imageUrl,
          requestId: Number(data.requestId!),
        },
      ]);
    },
    "invite-sent": (data) => {
      if (data.gameId === undefined) {
        throw new Error("No game id found");
      }

      console.log("invite sent", data);

      setGameInvites((prev) => [
        ...prev,
        {
          sender: {
            username: data.username,
            firstName: data.firstName,
            imageUrl: data.imageUrl,
            id: data.id,
          },
          gameId: data.gameId!,
        },
      ]);

      toast({
        title: "New Game Invite!",
        description: `Sent from ${data.username}`,
        duration: 5000,
        action: (
          <ToastAction
            altText="Accept"
            onClick={() => {
              router.push(`/${data.username}/${data.gameId}`);
            }}
          >
            Join
          </ToastAction>
        ),
      });
    },
    "invite-accepted": (data) => {
      console.log("invite accepted", data);

      const { id, friendId, gameId } = data;

      if (!friendId || !gameId) {
        throw new Error("No friend id or game id found");
      }

      // toast({
      //   title: "Invite Accepted!",
      //   description: `${data.username} has accepted your invite.`,
      //   duration: 5000,
      // });
    },
  });

  const values = useMemo(() => {
    const taggedPendingFriendRequests: TaggedPendingFriendRequest[] =
      pendingFriendRequests.map((request) => ({
        ...request,
        type: "PendingFriendRequest" as const,
      }));

    const taggedGameInvites: TaggedGameInvite[] = gameInvites.map((invite) => ({
      ...invite,
      type: "GameInvite" as const,
    }));

    const allNotifications: Notification[] = [
      ...taggedPendingFriendRequests,
      ...taggedGameInvites,
    ];

    return {
      activeFriends,
      pendingFriendRequests,
      gameInvites,
      allNotifications,
    };
  }, [activeFriends, pendingFriendRequests, gameInvites]);

  return (
    <PusherClientContext.Provider value={values}>
      {children}
    </PusherClientContext.Provider>
  );
}

export default FriendsChannelProvider;
