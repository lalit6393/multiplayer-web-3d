/**
 * Physics ground dimensions.
 * Values represent half-extents (width, height, depth).
 * The actual physics ground size will be double these values.
 */

const GROUND_HALF_SIZE = {
  x: 50,
  y: 0.5,
  z: 50,
};

//World gravity
const GRAVITY = { x: 0, y: -9.81, z: 0 };

//physics time step
const FIXED_TIME_STEP = 1 / 60; // 60 Hz

// prevent spiral of death
const MAX_STEPS = 5;

//restriction boudary walls
const WALL_THICKNESS = 0.5;
const WALL_HALF_HEIGHT = 10;

//player
const PLAYER_RADIUS = 0.4;
const PLAYER_HALF_HEIGHT = 1.2;

//player movement
const SPEED = 5;
const JUMP_VELOCITY = 8;  // units / second

module.exports = {
  GROUND_HALF_SIZE,
  GRAVITY,
  FIXED_TIME_STEP,
  MAX_STEPS,
  WALL_THICKNESS,
  WALL_HALF_HEIGHT,
  SPEED,
  PLAYER_RADIUS,
  PLAYER_HALF_HEIGHT,
  JUMP_VELOCITY,
};
