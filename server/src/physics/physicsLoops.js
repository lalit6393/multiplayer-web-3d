const { FIXED_TIME_STEP, MAX_STEPS } = require("../../constants");
const { simulatePlayers } = require("./simulation");

function startPhysicsLoop(world, io, RAPIER) {
  let lastTime = performance.now();
  let accumulator = 0;

  setInterval(() => {
    const now = performance.now();
    let delta = (now - lastTime) / 1000;
    lastTime = now;

    accumulator += delta;

    let steps = 0;
    while (accumulator >= FIXED_TIME_STEP && steps < MAX_STEPS) {
      simulatePlayers(world, io, RAPIER);
      world.step(); // physics update
      accumulator -= FIXED_TIME_STEP;
      steps++;
    }
  }, 16);
}

module.exports = { startPhysicsLoop };
