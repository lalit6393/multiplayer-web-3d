import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { PLAYER_CYLINDER_HEIGHT, PLAYER_RADIUS } from "../constants/playerConstants";
import type { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import * as THREE from 'three';
import { playerMovement } from "../helpers/movementHelper";
import { usePlayerInput } from "../hooks/usePlayerInput";
import { socket } from "../socket";
import { shallowEqual, useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { CapsuleCollider, RigidBody, useRapier, type RapierRigidBody } from "@react-three/rapier";

interface PlayerProps {
  groundRef: React.RefObject<THREE.Group>;
}

type PacketType = {
  seq: number;
  input: {
    yaw: number;
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    jump: boolean;
    pitch: number;
  };
}


const TICK_RATE = 1 / 60;
const SPEED = 5 * TICK_RATE;
const GRAVITY_PER_SECOND = -25;
const JUMP_VELOCITY = 12 * TICK_RATE;
const TICK_GRAVITY = GRAVITY_PER_SECOND * TICK_RATE * TICK_RATE; // Standard gravity needs a boost for games

const v3 = new THREE.Vector3();

const Player = forwardRef<THREE.Mesh, PlayerProps>((props, ref) => {
  const myId = useSelector((state: RootState) => state.player.myId);
  const snapshots = useSelector((state: RootState) => state.player.snapshots, shallowEqual);
  const rbRef = useRef<RapierRigidBody>(null!);
  const meshRef = useRef<Mesh>(null!);
  const { world } = useRapier();
  const inputRef = usePlayerInput();
  const inputSequence = useRef(0);

  // State Refs
  const verticalVelocity = useRef(0);
  const isGrounded = useRef(true);
  const inputHistory = useRef<PacketType[]>([]);
  const lastProcessedSnapshot = useRef<number>(-1);
  const accumulator = useRef<number>(0);

  const characterController = useMemo(() => {
    const controller = world.createCharacterController(0.01);
    controller.enableAutostep(0.5, 0.2, true);
    return controller;
  }, [world]);

  useImperativeHandle(ref, () => meshRef.current);

  // --- STANDARD SIMULATION FUNCTION ---
  // This logic MUST be identical to your server
  const runSimulationStep = (input: any) => {
    if (isGrounded.current && verticalVelocity.current <= 0) {
      verticalVelocity.current = 0;
      if (input.jump) verticalVelocity.current = JUMP_VELOCITY;
    } else {
      verticalVelocity.current += TICK_GRAVITY;
    }
    verticalVelocity.current = Math.max(verticalVelocity.current, -0.5);

    const move = playerMovement(input.yaw, input);

    characterController.computeColliderMovement(
      rbRef.current.collider(0),
      { x: move.moveX * SPEED, y: verticalVelocity.current, z: move.moveZ * SPEED }
    );

    const corrected = characterController.computedMovement();
    const currentPos = rbRef.current.translation();

    // Immediate apply for the simulation
    rbRef.current.setTranslation({
      x: currentPos.x + corrected.x,
      y: currentPos.y + corrected.y,
      z: currentPos.z + corrected.z
    }, true);

    isGrounded.current = characterController.computedGrounded();
  };

  // --- STANDARD RECONCILIATION ---
  useFrame(() => {
    if (!rbRef.current || snapshots.length === 0 || !myId) return;

    const latestSnapshot = snapshots[snapshots.length - 1];
    const myState = latestSnapshot.players[myId];

    // Check if we need to reconcile (Snap to server truth and replay)
    if (myState && myState.lastProcessedInputSeq > lastProcessedSnapshot.current) {
      lastProcessedSnapshot.current = myState.lastProcessedInputSeq;

      // 1. Teleport back to Server Truth
      rbRef.current.setTranslation(myState.position, true);
      verticalVelocity.current = myState.verticalVelocity;
      isGrounded.current = myState.isGrounded;

      // 2. Clear old history
      inputHistory.current = inputHistory.current.filter(p => p.seq > myState.lastProcessedInputSeq);

      // 3. Fast-forward back to present
      inputHistory.current.forEach(packet => {
        runSimulationStep(packet.input);
      });
    }
  });

  // --- STANDARD PREDICTION LOOP ---
  useFrame((_, delta) => {
    accumulator.current += Math.min(delta, 0.25);

    while (accumulator.current >= TICK_RATE) {
      // 1. Record input
      const seq = ++inputSequence.current;
      const packet = { seq, input: { ...inputRef.current } };

      // 2. Predict locally
      runSimulationStep(packet.input);

      // 3. Store for later reconciliation
      inputHistory.current.push(packet);
      socket.emit("player-input", packet);

      accumulator.current -= TICK_RATE;
    }

    // --- STANDARD VISUAL INTERPOLATION ---
    // This is how you stop the jitter. The mesh 'trails' the body.
    if (meshRef.current && rbRef.current) {
      const t = rbRef.current.translation();
      v3.set(t.x, t.y, t.z);
      // Use a standard lerp factor. 0.25 is a good balance of responsiveness and smoothness.
      meshRef.current.position.lerp(v3, 0.25);
    }
  });

  return (
    <>
      <RigidBody
        ref={rbRef}
        type="kinematicPosition"
        colliders={false}
        enabledRotations={[false, false, false]}
        position={[0, 5, 0]}
        gravityScale={0}
      >
        <CapsuleCollider
          args={[PLAYER_CYLINDER_HEIGHT / 2, PLAYER_RADIUS]}
          friction={0}
          restitution={0}
          frictionCombineRule={1}
          restitutionCombineRule={1}
        />
      </RigidBody>
      <mesh ref={meshRef}>
        <capsuleGeometry args={[PLAYER_RADIUS, PLAYER_CYLINDER_HEIGHT]} />
        <meshStandardMaterial color="purple" />
      </mesh>
    </>
  );
});

export default Player;