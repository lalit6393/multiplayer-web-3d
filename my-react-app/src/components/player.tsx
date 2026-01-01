import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { PLAYER_CYLINDER_HEIGHT, PLAYER_RADIUS } from "../constants/playerConstants";
import type { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import * as THREE from 'three';
import { playerMovement } from "../helpers/movementHelper";
import { usePlayerInput, type InputPacket } from "../hooks/usePlayerInput";
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
const SPEED = 5;
const GRAVITY = -9.8;       // units / second²
const JUMP_VELOCITY = 8;  // units / second

const Player = forwardRef<THREE.Mesh, PlayerProps>((_, ref) => {
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

  //position ref for interpolation
  const previousPosition = useRef(new THREE.Vector3());
  const currentPosition = useRef(new THREE.Vector3());

  const characterController = useMemo(() => {
    const controller = world.createCharacterController(0.01);
    controller.enableAutostep(0.5, 0.2, true);
    return controller;
  }, [world]);

  useImperativeHandle(ref, () => meshRef.current);


  const simulateLocal = (input: InputPacket) => {
    const collider = rbRef.current?.collider(0);
    if (!collider) return;
    
    // Jump
    if (isGrounded.current && input.jump) {
      verticalVelocity.current = JUMP_VELOCITY;
    }

    // Gravity (per-second)
    verticalVelocity.current += GRAVITY * TICK_RATE;

    // Clamp fall speed
    verticalVelocity.current = Math.max(verticalVelocity.current, -15);

    const move = playerMovement(input.yaw, input);

    const desiredTranslation = {
      x: move.moveX * SPEED * TICK_RATE,
      y: verticalVelocity.current * TICK_RATE,
      z: move.moveZ * SPEED * TICK_RATE
    };

    const wasGrounded = isGrounded.current;
    characterController.computeColliderMovement(collider, desiredTranslation);
    const corrected = characterController.computedMovement();
    const currentPos = rbRef.current.translation();
    isGrounded.current = characterController.computedGrounded();

    if (!wasGrounded && isGrounded.current && verticalVelocity.current < 0) {
      verticalVelocity.current = 0;
    }

    const newPos = {
      x: currentPos.x + corrected.x,
      y: currentPos.y + corrected.y,
      z: currentPos.z + corrected.z
    };

    rbRef.current.setTranslation(newPos, false);
  }

  function reconcileWithServer() {
    if (!rbRef.current || snapshots.length === 0 || !myId) return;

    const latestSnapshot = snapshots[snapshots.length - 1];
    const myState = latestSnapshot.players[myId];

    if (!myState) return;

    if (myState.lastProcessedInputSeq <= lastProcessedSnapshot.current) return;

    lastProcessedSnapshot.current = myState.lastProcessedInputSeq;

    // Snap to server truth
    rbRef.current.setTranslation(myState.position, true);
    verticalVelocity.current = myState.verticalVelocity;
    isGrounded.current = myState.isGrounded;

    // Remove confirmed inputs
    inputHistory.current = inputHistory.current.filter(
      p => p.seq > myState.lastProcessedInputSeq
    );

    // Replay remaining inputs (deterministic)
    inputHistory.current.forEach(packet => {
      simulateLocal(packet.input);
    });
  }


  // --- PREDICTION LOOP ---
  useFrame((_, delta) => {
    if (!myId) {
      // Render only — NO simulation
      meshRef.current.position.copy(currentPosition.current);
      return;
    }
    accumulator.current += Math.min(delta, 0.1);

    while (accumulator.current >= TICK_RATE) {
      previousPosition.current.copy(currentPosition.current);
      // Predict locally
      reconcileWithServer();
      // Record input
      const seq = ++inputSequence.current;
      const packet = { seq, input: { ...inputRef.current } };

      // Predict locally
      simulateLocal(packet.input);

      const t = rbRef.current.translation();

      currentPosition.current.set(t.x, t.y, t.z);

      // Store for later reconciliation
      inputHistory.current.push(packet);
      socket.emit("player-input", packet);

      accumulator.current -= TICK_RATE;
    }

    //interpolation logic
    const alpha = accumulator.current / TICK_RATE;

    if (meshRef.current && rbRef.current) {
      meshRef.current.position.lerpVectors(
        previousPosition.current,
        currentPosition.current,
        alpha
      );
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