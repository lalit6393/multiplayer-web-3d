const {
  JUMP_VELOCITY,
  GRAVITY,
  SPEED,
  FIXED_TIME_STEP,
} = require("../../constants");
const { getPlayers } = require("../players/players");
const { playerMovement } = require("../utils/func");

// Pre-allocate a single controller to save memory
let characterController = null;

function simulatePlayers(world, io, RAPIER) {
  if (!characterController) {
    characterController = world.createCharacterController(0.08);
    characterController.enableAutostep(0.5, 0.2, true);
  }

  const players = getPlayers();

  for (const id in players) {
    const player = players[id];
    const socket = io.sockets.sockets.get(id);
    if (!socket || socket.inputs.length === 0) continue;

    // Process all pending inputs (Input Replay/Catch-up)
    while (socket.inputs.length > 0) {
      const packet = socket.inputs.shift();
      const input = packet.input;

      const yaw = input.yaw || 0;
      if (player.verticalVelocity == null) {
        player.verticalVelocity = 0;
      }

      // Jump
      if (player.isGrounded && player.verticalVelocity <= 0 && input.jump) {
        player.verticalVelocity = JUMP_VELOCITY;
      }

      // Gravity (per-second)
      if (!player.isGrounded) {
        player.verticalVelocity += GRAVITY.y * FIXED_TIME_STEP;
      } else if (player.verticalVelocity < 0) {
        player.verticalVelocity = 0;
      }

      // Clamp fall speed
      player.verticalVelocity = Math.max(player.verticalVelocity, -15);

      const move = playerMovement(yaw, input);

      let dx = move.moveX * SPEED * FIXED_TIME_STEP;
      let dz = move.moveZ * SPEED * FIXED_TIME_STEP;

      const wasGrounded = player.isGrounded;
      characterController.computeColliderMovement(player.collider, {
        x: dx,
        y: player.verticalVelocity * FIXED_TIME_STEP,
        z: dz,
      });

      // B. Manual Gravity Logic (Match Player.tsx)
      const corrected = characterController.computedMovement();
      player.isGrounded = characterController.computedGrounded();
      if (!wasGrounded && player.isGrounded && player.verticalVelocity < 0) {
        player.verticalVelocity = 0;
      }

      // D. Apply resulting position
      const currentPos = player.body.translation();
      player.body.setTranslation({
        x: currentPos.x + corrected.x,
        y: currentPos.y + corrected.y,
        z: currentPos.z + corrected.z,
      });

      player.lastInputSeq = packet.seq;
    }
  }
}

module.exports = { simulatePlayers };
