import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { PLAYER_CYLINDER_HEIGHT, PLAYER_RADIUS } from "../constants/playerConstants";
import type { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import * as THREE from 'three';
import { playerMovement } from "../helpers/movementHelper";
import { usePlayerInput } from "../hooks/usePlayerInput";
import { socket } from "../socket";
import { useSelector } from "react-redux";
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


const Player = forwardRef<RapierRigidBody, PlayerProps>((props, ref) => {
  const rbRef = useRef<RapierRigidBody>(null!);
  const { world } = useRapier();
  const inputRef = usePlayerInput();
  const accumulator = useRef<number>(0);
  const meshRef = useRef<Mesh>(null!);
  const prevPosition = useRef(new THREE.Vector3());
  const currentPosition = useRef(new THREE.Vector3());
  const verticalVelocity = useRef(0);
  const inputSequence = useRef(0);
  const inputHistory = useRef<PacketType[]>([]);
  const myId = useSelector((state: RootState) => state.player.myId);
  const snapshots = useSelector((state: RootState) => state.player.snapshots);
  const lastProcessedSnapshot = useRef<number>(-1);
  const isGrounded = useRef<boolean>(true);

  // 1. Initialize the Character Controller to match Backend
  const characterController = useMemo(() => {
    const controller = world.createCharacterController(0.01);
    controller.enableAutostep(0.5, 0.2, true);
    return controller;
  }, [world]);

  useEffect(() => {
    if (snapshots.length === 0 || !myId || !rbRef.current) return;

    const latestSnapshot = snapshots[snapshots.length - 1];
    const myState = latestSnapshot.players[myId];

    if (myState && myState.lastProcessedInputSeq > lastProcessedSnapshot.current) {
      lastProcessedSnapshot.current = myState.lastProcessedInputSeq;

      // 1. TELEPORT TO SERVER TRUTH
      // We set the physics body to exactly where the server says it was
      rbRef.current.setTranslation(
        new THREE.Vector3(myState.position.x, myState.position.y, myState.position.z),
        true
      );
      console.log('velocity resetting to: ', verticalVelocity.current, myState.verticalVelocity);
      // Reset our local tracking of vertical velocity to server's truth
      // Note: If your server doesn't send velocity, you might need to track it
      if (myState.isGrounded) {
        verticalVelocity.current = 0;
      }


      // 2. DISCARD ACKNOWLEDGED INPUTS
      inputHistory.current = inputHistory.current.filter(
        (packet) => packet.seq > myState.lastProcessedInputSeq
      );

      // 3. THE REPLAY LOOP
      // We re-run every input the server hasn't seen yet
      inputHistory.current.forEach((packet) => {
        const currentPos = rbRef.current.translation();
        const move = playerMovement(packet.input.yaw, packet.input);

        // Compute movement exactly like simulation.js
        characterController.computeColliderMovement(
          rbRef.current.collider(0),
          {
            x: move.moveX * SPEED,
            y: verticalVelocity.current,
            z: move.moveZ * SPEED,
          }
        );

        const corrected = characterController.computedMovement();

        // Apply result to body immediately so the next loop iteration 
        // starts from this new corrected position
        // rbRef.current.setTranslation({
        //   x: currentPos.x + corrected.x,
        //   y: currentPos.y + corrected.y,
        //   z: currentPos.z + corrected.z,
        // }, false);

      });

      // 4. SYNC INTERPOLATION REFS
      // This prevents the visual mesh from "snapping" back to old positions
      currentPosition.current.copy(rbRef.current.translation() as THREE.Vector3);
      prevPosition.current.copy(currentPosition.current);
    }
  }, [snapshots, myId, characterController]);

  useImperativeHandle(ref, () => rbRef.current);


  useFrame((_, delta) => {
    if (!rbRef.current) return;
    accumulator.current += Math.min(delta, 0.25);

    const { yaw } = inputRef.current;

    // Inside useFrame while (accumulator.current >= TICK_RATE)
    while (accumulator.current >= TICK_RATE) {

      // 1. Update Velocity for Next Tick (Single Pass Logic)
      if (isGrounded.current && verticalVelocity.current <= 0) {
        verticalVelocity.current = 0;
        if (inputRef.current.jump) verticalVelocity.current = JUMP_VELOCITY;
      } else {
        verticalVelocity.current += TICK_GRAVITY;
      }
      verticalVelocity.current = Math.max(verticalVelocity.current, -0.5);

      // if (verticalVelocity.current > 0) {
      //   characterController.disableSnapToGround();
      // } else {
      //   characterController.enableSnapToGround(0.1);
      // }

      // Calculate movement vector
      const move = playerMovement(yaw, inputRef.current);
      const movementVector = {
        x: move.moveX * SPEED,
        y: verticalVelocity.current,
        z: move.moveZ * SPEED
      };

      // 2. Compute Movement (The Rapier Way)
      // This handles wall sliding and step-climbing automatically
      characterController.computeColliderMovement(
        rbRef.current.collider(0),
        movementVector
      );

      const corrected = characterController.computedMovement();
      isGrounded.current = characterController.computedGrounded();

      const currentTranslation = rbRef.current.translation();

      // 3. Apply New Position
      rbRef.current.setNextKinematicTranslation({
        x: currentTranslation.x + corrected.x,
        y: currentTranslation.y + corrected.y,
        z: currentTranslation.z + corrected.z
      });


      // 6. NETWORKING
      inputSequence.current++;
      const packet: PacketType = {
        seq: inputSequence.current,
        input: { ...inputRef.current }
      };
      socket.emit("player-input", packet);
      inputHistory.current.push(packet);

      accumulator.current -= TICK_RATE;
    }
  })

  return (
    <RigidBody
      ref={rbRef}
      type="kinematicPosition" // Crucial: must match backend logic
      colliders={false}         // We define a custom collider below
      enabledRotations={[false, false, false]} // Stops player from tipping over
      gravityScale={0}
      position={[0, 4, 0]}
    >
      <CapsuleCollider
        args={[PLAYER_CYLINDER_HEIGHT / 2, PLAYER_RADIUS]}
        friction={0}
        restitution={0}
        frictionCombineRule={1}
        restitutionCombineRule={1}
      />
      <mesh ref={meshRef}>
        <capsuleGeometry args={[PLAYER_RADIUS, PLAYER_CYLINDER_HEIGHT, 8, 16]} />
        <meshStandardMaterial color="purple" />
      </mesh>
    </RigidBody>
  );
});

export default Player;
