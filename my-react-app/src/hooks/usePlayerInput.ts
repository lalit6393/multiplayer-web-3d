import { useEffect, useRef } from "react";

export type InputPacket = {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    jump: boolean;
    yaw: number;
    pitch: number;
};

export function usePlayerInput() {
    const inputRef = useRef<InputPacket>({
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
        yaw: 0,
        pitch: 0,
    });

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space") inputRef.current.jump = true;
            if (e.code === "KeyW") inputRef.current.forward = true;
            if (e.code === "KeyS") inputRef.current.backward = true;
            if (e.code === "KeyA") inputRef.current.left = true;
            if (e.code === "KeyD") inputRef.current.right = true;
        };

        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === "Space") inputRef.current.jump = false;
            if (e.code === "KeyW") inputRef.current.forward = false;
            if (e.code === "KeyS") inputRef.current.backward = false;
            if (e.code === "KeyA") inputRef.current.left = false;
            if (e.code === "KeyD") inputRef.current.right = false;
        };

        const handleMouseMove = (e: MouseEvent) => {
            // Check if the pointer is locked to the canvas
            if (document.pointerLockElement) {
                const sensitivity = 0.002;
                inputRef.current.yaw -= e.movementX * sensitivity;
                inputRef.current.pitch -= e.movementY * sensitivity;

                // Limit pitch so the camera doesn't flip upside down
                inputRef.current.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, inputRef.current.pitch));
            }
        };

        // Lock the mouse when the user clicks the screen
        const handleClick = () => document.body.requestPointerLock();

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("click", handleClick);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("click", handleClick);
        };
    }, []);

    return inputRef;
}
