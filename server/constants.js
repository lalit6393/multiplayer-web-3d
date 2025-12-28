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
const SPEED = 5 * FIXED_TIME_STEP; //speed
const JUMP_IMPULSE = { x: 0, y: 12, z: 0 };

const JUMP_VELOCITY = 12 * FIXED_TIME_STEP; // Adjusted for 2025 feel
const TICK_GRAVITY = -25 * FIXED_TIME_STEP * FIXED_TIME_STEP; // Standard gravity needs a boost for games

module.exports = {
  GROUND_HALF_SIZE,
  GRAVITY,
  FIXED_TIME_STEP,
  MAX_STEPS,
  WALL_THICKNESS,
  WALL_HALF_HEIGHT,
  SPEED,
  JUMP_IMPULSE,
  PLAYER_RADIUS,
  PLAYER_HALF_HEIGHT,
  JUMP_VELOCITY,
  TICK_GRAVITY,
};
