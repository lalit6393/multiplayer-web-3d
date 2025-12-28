const {
  GROUND_HALF_SIZE,
  WALL_THICKNESS,
  WALL_HALF_HEIGHT,
} = require("../../constants");

function addBoundaryWalls(world, RAPIER) {
  const { x: groundX, z: groundZ } = GROUND_HALF_SIZE;

  const wallBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());

  // +X wall (right)
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(
      WALL_THICKNESS,
      WALL_HALF_HEIGHT,
      groundZ
    ).setTranslation(groundX + WALL_THICKNESS, WALL_HALF_HEIGHT, 0),
    wallBody
  );

  // -X wall (left)
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(
      WALL_THICKNESS,
      WALL_HALF_HEIGHT,
      groundZ
    ).setTranslation(-groundX - WALL_THICKNESS, WALL_HALF_HEIGHT, 0),
    wallBody
  );

  // +Z wall (front)
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(
      groundX,
      WALL_HALF_HEIGHT,
      WALL_THICKNESS
    ).setTranslation(0, WALL_HALF_HEIGHT, groundZ + WALL_THICKNESS),
    wallBody
  );

  // -Z wall (back)
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(
      groundX,
      WALL_HALF_HEIGHT,
      WALL_THICKNESS
    ).setTranslation(0, WALL_HALF_HEIGHT, -groundZ - WALL_THICKNESS),
    wallBody
  );
}

module.exports = { addBoundaryWalls };
