type InputType = {
    forward: boolean,
    backward: boolean;
    left: boolean;
    right: boolean;
    jump: boolean
}

/**
 * Calculates movement vectors based on player rotation and keyboard input.
 * 
 * @param yaw - The angle in radians measured from the +Z axis (rotation around Y).
 * @param input - The state of directional keys.
 * @returns An object containing the move components in world coordinates.
 */
export const playerMovement = (yaw: number, input: InputType) => {
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);

    const forwardVec = { x: -sin, z: -cos };
    const rightVec = { x: cos, z: -sin };

    const moveZAxis = +input.forward - +input.backward;
    const moveXAxis = +input.right - +input.left;

    let moveX = (forwardVec.x * moveZAxis) + (rightVec.x * moveXAxis);
    let moveZ = (forwardVec.z * moveZAxis) + (rightVec.z * moveXAxis);

    const len = Math.hypot(moveX, moveZ);
    if (len > 0) {
        moveX /= len;
        moveZ /= len;
    }

    return { moveX, moveZ };
}