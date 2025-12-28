import { Suspense, useEffect, useRef } from "react";
import { socket } from "./socket";
import { startNetworkSync } from "./network/networkSync";
import { useDispatch } from "react-redux";
import { Canvas, type RootState } from "@react-three/fiber";
import Player from "./components/player";
import Ground from "./components/ground";
import OtherPlayers from "./components/otherPlayers";
import * as THREE from 'three';
import { usePlayerInput } from "./hooks/usePlayerInput";
import { CameraController } from "./controllers/cameraContoller";
import { Physics } from "@react-three/rapier";

const App = () => {

  const dispatch = useDispatch();
  const groundGroupRef = useRef<THREE.Group>(null!);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerRef = useRef<THREE.Mesh>(null!);
  const inputRef = usePlayerInput();

  useEffect(() => {
    startNetworkSync(dispatch);

    return () => {
      socket.disconnect();
    }
  }, []);

  return (
    <>
      <Suspense>
        <Canvas
          onCreated={(state: RootState) => (canvasRef.current = state.gl.domElement)}
          camera={{ fov: 75, position: [0, 10, 20] }}
        >
          <ambientLight position={[50, 50, 50]} intensity={0.6} />
          <directionalLight position={[100, 50, 100]} intensity={0.6} />
          <axesHelper args={[5]} />
          <CameraController playerRef={playerRef} inputRef={inputRef} />
          <Physics >
            <Player ref={playerRef} groundRef={groundGroupRef} />
            <group ref={groundGroupRef}>
              <OtherPlayers />
              <Ground />
            </group>
          </Physics>
        </Canvas>
      </Suspense>
    </>
  );
}

export default App;
