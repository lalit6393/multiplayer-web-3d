import { PLAYER_CYLINDER_HEIGHT, PLAYER_RADIUS } from "../constants/playerConstants";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { usePlayerInput } from "../hooks/usePlayerInput";
import { socket } from "../socket";

const FIXED_DT = 1 / 60;
const SPEED = 5;

type InputPacket = {
  seq: number;
  input: any;
};

const Player = () => {
  const inputRef = usePlayerInput();
  const meshRef = useRef<THREE.Mesh | null>(null);

  const snapshots = useSelector((s: RootState) => s.player.snapshots);
  const myId = useSelector((s: RootState) => s.player.myId);

  const predictedPos = useRef(new THREE.Vector3());
  const accumulator = useRef(0);

  const inputSeq = useRef(0);
  const pendingInputs = useRef<InputPacket[]>([]);
  const lastSnapshotTick = useRef<number | null>(null);

  /* --------------------
     PURE INPUT SIMULATION
  --------------------- */
  const simulateInput = (input: any) => {
    let vx = 0;
    let vz = 0;

    if (input.forward) vz -= SPEED;
    if (input.backward) vz += SPEED;
    if (input.left) vx -= SPEED;
    if (input.right) vx += SPEED;

    predictedPos.current.x += vx * FIXED_DT;
    predictedPos.current.z += vz * FIXED_DT;
  };

  /* --------------------
     SERVER RECONCILIATION
  --------------------- */
  useEffect(() => {
    if (!snapshots.length || !myId) return;

    const snap = snapshots[snapshots.length - 1];
    if (snap.tick === lastSnapshotTick.current) return;
    lastSnapshotTick.current = snap.tick;

    const serverPlayer = snap.players[myId];
    if (!serverPlayer) return;

    // 1️⃣ RESET to authoritative state
    predictedPos.current.set(
      serverPlayer.position.x,
      serverPlayer.position.y,
      serverPlayer.position.z
    );

    // 2️⃣ DROP acknowledged inputs
    pendingInputs.current = pendingInputs.current.filter(
      (p) => p.seq > serverPlayer.lastProcessedInputSeq
    );

    // 3️⃣ REPLAY remaining inputs
    for (const p of pendingInputs.current) {
      simulateInput(p.input);
    }
  }, [snapshots, myId]);

  /* --------------------
     FIXED STEP PREDICTION
  --------------------- */
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    accumulator.current += delta;

    while (accumulator.current >= FIXED_DT) {
      simulateInput(inputRef.current);
      accumulator.current -= FIXED_DT;
    }

    meshRef.current.position.copy(predictedPos.current);

    /* --------------------
       SEND INPUT
    --------------------- */
    const packet: InputPacket = {
      seq: inputSeq.current++,
      input: { ...inputRef.current },
    };

    pendingInputs.current.push(packet);
    socket.emit("player-input", packet);
  });

  return (
    <mesh ref={meshRef} name={`player-${myId}`}>
      <capsuleGeometry args={[PLAYER_RADIUS, PLAYER_CYLINDER_HEIGHT, 8, 16]} />
      <meshStandardMaterial color="purple" />
    </mesh>
  );
};

export default Player;
