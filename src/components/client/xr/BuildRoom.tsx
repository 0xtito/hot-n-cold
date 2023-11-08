"use client";

import {
  useTrackedMeshes,
  useTrackedPlanes,
} from "@coconut-xr/natuerlich/react";
import SpacialMesh from "./SpacialMesh";
import SpacialPlane from "./SpacialPlane";
import { useId, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Color } from "three";
import _ from "lodash";

function BuildRoom() {
  const meshes = useTrackedMeshes();
  const planes = useTrackedPlanes();
  const key = useId();

  console.log("rerender build room");
  const [init, setInit] = useState(false);

  if (!meshes || !planes) return null;

  return (
    <>
      <group key="meshes">
        {meshes.map((mesh, index) => (
          <SpacialMesh
            key={key + `${index}`}
            mesh={mesh}
            name={mesh.semanticLabel}
          />
        ))}
      </group>

      <group key={"planes"}>
        {/* <SpacialPlane /> */}
        {planes.map((plane, index) => (
          <SpacialPlane
            key={key + `${index}`}
            plane={plane}
            name={plane.semanticLabel}
          />
        ))}
      </group>
    </>
  );
}

export default BuildRoom;
