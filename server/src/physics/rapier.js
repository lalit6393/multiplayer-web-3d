const RAPIER = require("@dimforge/rapier3d-compat");

let rapierReady = null;

function loadRapier() {
  if (!rapierReady) {
    rapierReady = RAPIER.init().then(() => {
      console.log("Rapier initialized:", RAPIER.version());
      return RAPIER;
    });
  }
  return rapierReady;
}

module.exports = { loadRapier };
