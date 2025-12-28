import { PLAYER_CYLINDER_HEIGHT, PLAYER_RADIUS } from "../constants/playerConstants";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { RigidBody, CapsuleCollider, type RapierRigidBody } from "@react-three/rapier";

type Props = {
  playerId: string;
};

const INTERPOLATION_DELAY = 100;

const RemotePlayer = ({ playerId }: Props) => {
  const rbRef = useRef<RapierRigidBody>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const snapshots = useSelector((state: RootState) => state.player.snapshots);

  const renderPos = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!rbRef.current) return;
    if (snapshots.length < 2) return;

    const renderTime = Date.now() - INTERPOLATION_DELAY;

    let older = null;
    let newer = null;

    for (let i = snapshots.length - 1; i >= 1; i--) {
      if (snapshots[i - 1].tick <= renderTime && snapshots[i].tick >= renderTime) {
        older = snapshots[i - 1];
        newer = snapshots[i];
        break;
      }
    }

    if (!older || !newer) return;

    const p1 = older.players[playerId];
    const p2 = newer.players[playerId];
    if (!p1 || !p2) return;

    const t = (renderTime - older.tick) / (newer.tick - older.tick);

    renderPos.current.set(
      THREE.MathUtils.lerp(p1.position.x, p2.position.x, t),
      THREE.MathUtils.lerp(p1.position.y, p2.position.y, t),
      THREE.MathUtils.lerp(p1.position.z, p2.position.z, t)
    );

    // 1. Move the Physics Body
    // Using setNextKinematicTranslation ensures that the local player's
    // CharacterController can "feel" this object and not walk through it.
    rbRef.current.setNextKinematicTranslation(renderPos.current);
    
    // 2. Sync the mesh (if the mesh is outside the RB) 
    // or just let the RB move the mesh if it's a child.
    if (meshRef.current) {
        meshRef.current.position.copy(renderPos.current);
    }
  });

  return (
    <>
      {/* Invisible Physics Collider */}
      <RigidBody
        ref={rbRef}
        type="kinematicPosition"
        colliders={false}
        // This ensures the remote player doesn't move when you bump into them
        // Only the interpolation logic should move them
      >
        <CapsuleCollider args={[PLAYER_CYLINDER_HEIGHT / 2, PLAYER_RADIUS]} />
      </RigidBody>

      {/* Visual Representation */}
      <mesh ref={meshRef} name={`player-${playerId}`}>
        <capsuleGeometry args={[PLAYER_RADIUS, PLAYER_CYLINDER_HEIGHT, 8, 16]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    </>
  );
};

export default RemotePlayer;