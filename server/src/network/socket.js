const { PLAYER_HALF_HEIGHT, PLAYER_RADIUS } = require("../../constants");
const { addPlayer, removePlayer } = require("../players/players");

function registerSockets(io, world, RAPIER) {
  io.on("connection", (socket) => {
    // 1. Create Kinematic Velocity Body (Best for manual + physics sync)
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(Math.random() * 4, 10, Math.random() * 4)
      .setCanSleep(false);

    const body = world.createRigidBody(bodyDesc);

    // 2. Create Collider (Match your Player.tsx Capsule)
    const colliderDesc = RAPIER.ColliderDesc.capsule(
      PLAYER_HALF_HEIGHT,
      PLAYER_RADIUS
    )
      .setFriction(0)
      .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min)
      .setRestitution(0)
      .setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);

    const collider = world.createCollider(colliderDesc, body);

    addPlayer(socket.id, {
      body,
      collider,
      verticalVelocity: 0,
      lastInputSeq: 0,
    });

    socket.inputs = [];

    socket.on("player-input", (packet) => {
      // Basic rate limiting: don't let a client flood the array
      if (socket.inputs.length < 60) {
        socket.inputs.push(packet);
      }
    });

    socket.on("disconnect", () => {
      removePlayer(socket.id);
      world.removeRigidBody(body);
    });
  });
}

module.exports = { registerSockets };
