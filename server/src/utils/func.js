function isGrounded(world, rb, collider, RAPIER) {
  const pos = rb.translation(); // returns {x, y, z}

  const HALF_HEIGHT = 1.2;
  const RADIUS = 0.4;
  const EPSILON = 0.05;
  const maxToi = 0.1;

  // Bottom of capsule
  const bottomY = pos.y - (HALF_HEIGHT + RADIUS);

  // Ray origin slightly above bottom
  const rayOrigin = {
    x: pos.x,
    y: bottomY + EPSILON,
    z: pos.z,
  };

  const rayDir = { x: 0, y: -1, z: 0 };

  // Must use `new RAPIER.Ray`
  const ray = new RAPIER.Ray(rayOrigin, rayDir);

  const hit = world.castRay(ray, maxToi, true, null, null, collider);

  return hit !== null;
}

/**
 * Calculates movement vectors based on player rotation and keyboard input.
 *
 * @param yaw - The angle in radians measured from the +Z axis (rotation around Y).
 * @param input - The state of directional keys.
 * @returns An object containing the move components in world coordinates.
 */
const playerMovement = (yaw, input) => {
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);

  const forwardVec = { x: -sin, z: -cos };
  const rightVec = { x: cos, z: -sin };

  const moveZAxis = +input.forward - +input.backward;
  const moveXAxis = +input.right - +input.left;

  let moveX = forwardVec.x * moveZAxis + rightVec.x * moveXAxis;
  let moveZ = forwardVec.z * moveZAxis + rightVec.z * moveXAxis;

  const len = Math.hypot(moveX, moveZ);
  if (len > 0) {
    moveX /= len;
    moveZ /= len;
  }

  return { moveX, moveZ };
};

module.exports = { isGrounded, playerMovement };
