"use client";

import { Suspense, useState } from "react";
import { ControllerStateProvider } from "@/components/providers";
// import { BuildRoom } from "@/components/client/xr";
import { Button } from "@/components/ui/button";
import type { SandboxProps } from "@/lib/types";
// import { clippingEvents } from "@coconut-xr/koestlich";
import { getInputSourceId } from "@coconut-xr/natuerlich";
import { PointerController, XRCanvas } from "@coconut-xr/natuerlich/defaults";
import {
  FocusStateGuard,
  ImmersiveSessionOrigin,
  NonImmersiveCamera,
  useEnterXR,
  useHeighestAvailableFrameRate,
  useInputSources,
  useNativeFramebufferScaling,
  useSessionChange,
  useSessionSupported,
} from "@coconut-xr/natuerlich/react";
// import { Container, Root } from "@react-three/uikit";
import {
  // BuildPhysicalMeshes,
  // BuildPhysicalPlanes,
  PhysicalObject,
  TrueHand,
  XRPhysics,
} from "@vixuslabs/newtonxr";

import GameSphere from "../hotncold/GameSphere";
import { RapierMeshes, RapierPlanes } from "./rapier";

// import { ConfirmBall, ResetGame } from "./uikit";
// import { DefaultColors } from "./uikit/kits/colors";

const sessionOptions: XRSessionInit = {
  requiredFeatures: [
    "local-floor",
    "hand-tracking",
    "mesh-detection",
    "plane-detection",
  ],
  // optionalFeatures: ["mesh-detection", "plane-detection"],
};

function Sandbox({ username: _ }: SandboxProps) {
  const [startSync, setStartSync] = useState(false);
  const inputSources = useInputSources();

  const enterAR = useEnterXR("immersive-ar", sessionOptions);
  const isSupported = useSessionSupported("immersive-ar");

  useSessionChange((curSession, prevSession) => {
    if (prevSession && !curSession) {
      console.log("session ended");
      setStartSync(false);
    }
  }, []);

  const frameBufferScaling = useNativeFramebufferScaling();
  const frameRate = useHeighestAvailableFrameRate();

  return (
    <>
      <div className="absolute z-10 flex flex-col items-center justify-center gap-y-2">
        <h2 className="relative text-center text-2xl font-bold">
          Welcome! Press below to launch WebXR
        </h2>
        <p className="relative text-center text-2xl font-bold">
          Enjoy this sandbox environment, more to come!
        </p>
        <Button
          disabled={!isSupported}
          className="relative"
          variant="default"
          onClick={() => {
            console.log("clicked!");
            void enterAR().then(() => {
              console.log("entered");
              setStartSync(true);
            });
          }}
        >
          {isSupported ? "Begin" : "Device not Compatible :("}
        </Button>
      </div>

      <Suspense fallback={null}>
        <XRCanvas
          frameBufferScaling={frameBufferScaling}
          frameRate={frameRate}
          // dpr={[1, 2]}
          // // @ts-expect-error - import error
          // events={clippingEvents}
          gl={{ localClippingEnabled: true }}
        >
          <ambientLight intensity={1} />

          <FocusStateGuard>
            <ControllerStateProvider>
              <XRPhysics
              // debug
              // colliders={false}
              // gravity={[0, -5, 0]}
              >
                <NonImmersiveCamera />

                {startSync && (
                  <>
                    <GameSphere
                      inGame={false}
                      color="blue"
                      position={[0, 2, -0.3]}
                    />
                    <GameSphere inGame={false} position={[0, 1, -0.3]} />

                    <Boxes />
                  </>
                )}

                {/* <group position={[0, 1.5, -0.5]} scale={0.1}>
                  <Root backgroundColor={0xffffff} pixelSize={0.01}>
                    <DefaultColors />
                    <Container
                      backgroundOpacity={0}
                      borderBend={10}
                      borderRadius={16}
                    >
                      <ConfirmBall />
                    </Container>
                  </Root>
                </group> */}

                <ImmersiveSessionOrigin>
                  {startSync && (
                    <>
                      <RapierMeshes excludeGlobalMesh />
                      <RapierPlanes />

                      {/* <group position={[0, 1.5, -0.5]} scale={0.1}>
                        <Root backgroundColor={0xffffff} pixelSize={0.01}>
                          <Container
                            backgroundOpacity={0}
                            borderBend={10}
                            borderRadius={16}
                          >
                            <ResetGame />
                          </Container>
                        </Root>
                      </group> */}
                    </>
                  )}
                  {/* <BuildPhysicalMeshes excludeGlobalMesh />
                <BuildPhysicalPlanes /> */}

                  {inputSources?.map((inputSource) =>
                    inputSource.hand ? (
                      <TrueHand
                        key={getInputSourceId(inputSource)}
                        inputSource={inputSource}
                        id={getInputSourceId(inputSource)}
                        XRHand={inputSource.hand}
                      />
                    ) : (
                      <PointerController
                        key={getInputSourceId(inputSource)}
                        id={getInputSourceId(inputSource)}
                        inputSource={inputSource}
                      />
                    ),
                  )}
                </ImmersiveSessionOrigin>
              </XRPhysics>
            </ControllerStateProvider>
          </FocusStateGuard>
        </XRCanvas>
      </Suspense>
    </>
  );
}

export default Sandbox;

function Boxes() {
  return (
    <>
      <PhysicalObject
        colliders="cuboid"
        restitution={0.2}
        position={[-0.1, 2, -0.2]}
      >
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color={"orange"} />
      </PhysicalObject>

      {/* Boxes */}
      <PhysicalObject
        colliders="cuboid"
        restitution={0.2}
        position={[-0.05, 2, -0.2]}
      >
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color={"pink"} />
      </PhysicalObject>

      <PhysicalObject
        colliders="cuboid"
        restitution={0.2}
        position={[0, 2, -0.2]}
      >
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color={"green"} />
      </PhysicalObject>

      <PhysicalObject
        colliders="cuboid"
        restitution={0.2}
        position={[0.05, 2, -0.2]}
      >
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color={"blue"} />
      </PhysicalObject>

      <PhysicalObject
        colliders="cuboid"
        restitution={0.2}
        position={[0.1, 2, -0.2]}
      >
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color={"red"} />
      </PhysicalObject>
    </>
  );
}
