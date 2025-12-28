const { SPEED, JUMP_IMPULSE } = require("../../constants");
const { getPlayers } = require("../players/players");
const { isGrounded } = require("../utils/func");

function consumeInputs(socket) {
  if (!socket || socket.inputs.length === 0) return [];
  const inputs = socket.inputs;
  socket.inputs = [];
  return inputs;
}

function applyMovement(rb, input) {
  const vel = rb.linvel();

  let vx = 0;
  let vz = 0;

  if (input.forward) vz -= SPEED;
  if (input.backward) vz += SPEED;
  if (input.left) vx -= SPEED;
  if (input.right) vx += SPEED;

  rb.setLinvel(
    {
      x: vx,
      y: vel.y, // preserve gravity
      z: vz,
    },
    true
  );
}

function applyJump(world, rb, input, RAPIER, collider) {
  if (!input.jump) return;
  if (!isGrounded(world, rb, collider, RAPIER)) return;

  rb.applyImpulse(JUMP_IMPULSE, true);
}

function simulatePlayers(world, io, RAPIER) {
  const players = getPlayers();

  for (const id in players) {
    const player = players[id];
    const socket = io.sockets.sockets.get(id);
    if (!socket) continue;

    const inputs = consumeInputs(socket);
    if (!inputs.length) continue;

    const rb = player.body;
    const collider = player.collider;
    if (!rb) continue;

    for (const inputObj of inputs) {
      const input = inputObj.input;
      applyMovement(rb, input);
      applyJump(world, rb, input, RAPIER, collider);

      player.lastInputSeq = input.seq; // IMPORTANT
    }
  }
}

module.exports = { simulatePlayers };
