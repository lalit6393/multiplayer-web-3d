import { useFrame, useThree } from "@react-three/fiber";
import type { RefObject } from "react";
import * as THREE from "three";

interface InputPacket {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    jump: boolean;
    yaw: number;
    pitch: number;
}

interface CameraControllerProps {
    // A RefObject specifically for a Three.js Mesh
    playerRef: RefObject<THREE.Mesh>;
    // A RefObject for your custom input packet
    inputRef: RefObject<InputPacket>;
}

const CAMERA_BASE_OFFSET = new THREE.Vector3(0, 0, 10);
const tempVec = new THREE.Vector3();
const tempEuler = new THREE.Euler();

export const CameraController = ({ playerRef, inputRef }: CameraControllerProps) => {
    const { camera } = useThree();

    useFrame(() => {
        if (!playerRef.current) return;

        const { yaw, pitch } = inputRef.current;
        const playerPos = playerRef.current.position;

        // Calculate Orbit Position
        tempVec.copy(CAMERA_BASE_OFFSET);
        tempEuler.set(pitch, yaw, 0, 'YXZ');
        tempVec.applyEuler(tempEuler);

        const targetCameraPos = new THREE.Vector3(
            playerPos.x + tempVec.x,
            playerPos.y + tempVec.y + 5, // Height offset
            playerPos.z + tempVec.z
        );

        // Smooth Follow & Look
        camera.position.lerp(targetCameraPos, 0.1);
        camera.lookAt(playerPos.x, playerPos.y + 1.5, playerPos.z);
    });

    return null; // This component doesn't render anything itself
};