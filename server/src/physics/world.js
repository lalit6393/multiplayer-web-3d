const { loadRapier } = require("./rapier");
const { GROUND_HALF_SIZE, GRAVITY } = require("../../constants");
const { addBoundaryWalls } = require("../components/boundaryWalls");

async function createWorld() {
  const RAPIER = await loadRapier();

  const world = new RAPIER.World(GRAVITY);

  // Large static ground collider (finite)
  const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());

  const { x, y, z } = GROUND_HALF_SIZE;

  world.createCollider(
    RAPIER.ColliderDesc.cuboid(x, y, z).setTranslation(0, -y, 0),
    groundBody
  );

  // Walls
  addBoundaryWalls(world, RAPIER);

  return { world, RAPIER };
}

module.exports = { createWorld };
