const { SPEED, JUMP_VELOCITY, TICK_GRAVITY } = require("../../constants");
const { getPlayers } = require("../players/players");
const { playerMovement } = require("../utils/func");

// Pre-allocate a single controller to save memory
let characterController = null;

function simulatePlayers(world, io, RAPIER) {
  if (!characterController) {
    characterController = world.createCharacterController(0.01);
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

      if (player.isGrounded && player.verticalVelocity <= 0) {
        player.verticalVelocity = 0;
        if (input.jump) player.verticalVelocity = JUMP_VELOCITY;
      } else {
        player.verticalVelocity += TICK_GRAVITY;
      }

      player.verticalVelocity = Math.max(player.verticalVelocity, -0.5);

      const move = playerMovement(yaw, input);

      let dx = move.moveX * SPEED;
      let dz = move.moveZ * SPEED;

      characterController.computeColliderMovement(player.collider, {
        x: dx,
        y: player.verticalVelocity,
        z: dz,
      });

      // B. Manual Gravity Logic (Match Player.tsx)
      const corrected = characterController.computedMovement();
      player.isGrounded = characterController.computedGrounded();

      // D. Apply resulting position
      const currentPos = player.body.translation();
      player.body.setNextKinematicTranslation({
        x: currentPos.x + corrected.x,
        y: currentPos.y + corrected.y,
        z: currentPos.z + corrected.z,
      });

      player.lastInputSeq = packet.seq;
    }
  }
}

module.exports = { simulatePlayers };
