"use client";

import React, { forwardRef, useCallback, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { useControllerStateContext } from "@/components/providers/ControllerStateProvider";
import useTrackControllers from "@/lib/hooks/useTrackControllers";
import { useHotnCold } from "@/lib/stores";
import type { GrabProps, ObjectHeldCheck, RigidAndMeshRefs } from "@/lib/types";
import { ButtonState } from "@coconut-xr/natuerlich/react";
import { isXIntersection } from "@coconut-xr/xinteraction";
import type { ThreeEvent } from "@react-three/fiber";
import { vec3 } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import { Vector3 } from "three";
import type { Mesh } from "three";

const GrabPhysics = forwardRef<RigidAndMeshRefs, GrabProps>(
  (
    { children, handleGrab, handleRelease, id, isAnchorable = false },
    rigidAndMeshRef,
  ) => {
    const { me, setObjectPosition } = useHotnCold();

    const [isObjectSet, setIsObjectSet] = React.useState(false);
    const [isAnchored, setIsAnchored] = React.useState(false);
    const downState = useRef<{
      pointerId: number;
      pointToObjectOffset: Vector3;
      zPosition: number;
      positions: Vector3[];
      timestamps: number[];
    }>();

    /* eslint-disable */
    const rigidRef = useMemo(
      () =>
        // @ts-expect-error - current exists
        rigidAndMeshRef!.current?.rigidRef as MutableRefObject<RapierRigidBody>,
      [rigidAndMeshRef],
    );

    const meshRef = useMemo(
      // @ts-expect-error - current exists
      () => rigidAndMeshRef!.current?.ref as MutableRefObject<Mesh>,
      [rigidAndMeshRef],
    );
    /* eslint-enable */

    const maxEntries = useMemo(() => 5, []);
    const [leftController, rightController] = useTrackControllers();
    const { pointers } = useControllerStateContext();
    // const isXPressed = useButtonListener("x-button");

    const adjustPositionByThumbstick = useCallback(
      (handness: "left" | "right", e: ThreeEvent<PointerEvent>) => {
        if (!rigidRef?.current) return;

        const currentPointerState = pointers[handness];

        const controllerPosition =
          handness == "left"
            ? leftController?.position
            : rightController?.position;

        if (controllerPosition) {
          const rayDirection = new Vector3()
            .subVectors(e.point, controllerPosition)
            .normalize();
          // console.log("rayDirection", rayDirection);
          const offset = currentPointerState.z;

          const adjustedPosition = new Vector3().addVectors(
            controllerPosition,
            rayDirection.multiplyScalar(-offset),
          );

          rigidRef.current.setTranslation(vec3(adjustedPosition), true);
        }
      },
      [leftController?.position, pointers, rightController?.position, rigidRef],
    );

    const checkIfObjectHeldByPointer: () => ObjectHeldCheck =
      useCallback(() => {
        if (
          pointers.left.heldObject &&
          pointers.left.heldObject.uuid == meshRef.current.uuid
        ) {
          return {
            objectHeldByPointer: true,
            handness: "left",
          };
        } else if (
          pointers.right.heldObject &&
          pointers.right.heldObject.uuid == meshRef.current.uuid
        ) {
          return {
            objectHeldByPointer: true,
            handness: "right",
          };
        } else {
          return {
            objectHeldByPointer: false,
            handness: undefined,
          };
        }
      }, [pointers, meshRef]);

    const handleAnchor: () => void = useCallback(() => {
      if (!rigidRef?.current) return;
      rigidRef.current.setBodyType(1, true);
      rigidRef.current.resetTorques(true);
      rigidRef.current.resetForces(true);
      setIsAnchored(true);

      console.log("anchoring");

      if (me && me.hiding && !isObjectSet) {
        setIsObjectSet(true);

        downState.current = undefined;

        const myObjectPosition = meshRef.current.getWorldPosition(
          meshRef.current.position,
        );

        void setObjectPosition(myObjectPosition, "me");
      }
    }, [rigidRef, meshRef, me, setObjectPosition, isObjectSet]);

    return (
      <mesh
        name={id}
        ref={meshRef}
        onPointerDown={(e) => {
          if (
            meshRef.current != null &&
            meshRef.current.visible &&
            downState.current == null &&
            isXIntersection(e)
            // isXIntersection(e) &&
            // !isAnchored
          ) {
            e.stopPropagation();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);

            downState.current = {
              pointerId: e.pointerId,
              pointToObjectOffset: meshRef.current.position
                .clone()
                .sub(e.point),
              zPosition: e.point.z,
              positions: [],
              timestamps: [],
            };
            handleGrab(e);
          }
        }}
        onPointerUp={(e) => {
          if (downState.current?.pointerId != e.pointerId || isAnchored) {
            return;
          }
          if (
            downState.current.positions.length > 1 &&
            downState.current.timestamps
          ) {
            const lastIndex = downState.current.positions.length - 1;
            const deltaTime =
              (downState.current.timestamps[lastIndex]! -
                downState.current.timestamps[0]!) /
              1000;

            const deltaPosition = downState.current.positions[
              lastIndex
            ]!.clone().sub(downState.current.positions[0]!);
            const velocity = deltaPosition.divideScalar(deltaTime);

            downState.current = undefined;

            handleRelease(e, velocity);
          }
        }}
        onPointerMove={(e) => {
          // const isXPressed =
          //   leftController?.gamepad.buttons["x-button"] === ButtonState.PRESSED;
          // if (isXPressed) return;
          if (
            isAnchored &&
            rightController &&
            rightController.gamepad.buttons["b-button"] === ButtonState.PRESSED
          ) {
            // console.log('unanchoring from "b" button press');
            // handleUnanchor();
            return;
          }

          if (
            meshRef.current == null ||
            downState.current == null ||
            !isXIntersection(e) ||
            isAnchored
          ) {
            return;
          }
          const { objectHeldByPointer, handness } =
            checkIfObjectHeldByPointer();

          if (!handness || !objectHeldByPointer) return;

          if (
            leftController &&
            leftController.gamepad.buttons["x-button"] ===
              ButtonState.PRESSED &&
            leftController.gamepad.buttons["y-button"] ===
              ButtonState.PRESSED &&
            isAnchorable
          ) {
            console.log("setting object");
            downState.current = undefined;
            handleAnchor();
            return;
          }

          const timeStamp = new Date().getTime();
          downState.current.positions.push(e.point);
          downState.current.timestamps.push(timeStamp);

          if (downState.current.positions.length > maxEntries) {
            downState.current.positions.shift();
            downState.current.timestamps.shift();
          }

          if (handness) {
            adjustPositionByThumbstick(handness, e);
          }
        }}
      >
        {children}
      </mesh>
    );
  },
);

GrabPhysics.displayName = "GrabPhysics";

export default React.memo(GrabPhysics);
