import { useFrame, useThree } from "@react-three/fiber";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { useState } from "react";
import * as THREE from "three";

interface FollowCameraProps {
  offset?: THREE.Vector3;
}

const FollowCamera = ({
  offset = new THREE.Vector3(0, 5, 8),
}: FollowCameraProps) => {
  const { camera, scene } = useThree();

  const myId = useSelector((state: RootState) => state.player.myId);
  const snapshots = useSelector(
    (state: RootState) => state.player.snapshots
  );

  const [targetId, setTargetId] = useState<string | null>(null);

  useFrame((_, delta) => {
    if (!snapshots.length) return;

    // determine who to follow
    const followId = targetId ?? myId;
    if (!followId) return;

    // meshes are named with playerId
    const targetMesh = scene.getObjectByName(
      `player-${followId}`
    ) as THREE.Object3D | null;

    if (!targetMesh) return;

    const targetPos = targetMesh.getWorldPosition(
      new THREE.Vector3()
    );

    const desiredPos = targetPos.clone().add(offset);

    // smooth camera movement
    camera.position.lerp(
      desiredPos,
      1 - Math.exp(-5 * delta)
    );

    camera.lookAt(targetPos);
  });

  // optional spectate API
  const spectate = (playerId: string | null) => {
    setTargetId(playerId);
  };

  return null;
};

export default FollowCamera;
