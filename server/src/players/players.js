/**
 * @typedef {Object} PlayerPhysics
 * @property {import("@dimforge/rapier3d-compat").RigidBody} body
 * @property {import("@dimforge/rapier3d-compat").Collider} collider
 */

/**
 * @typedef {Object} ServerPlayer
 * @property {string} id
 * @property {import("@dimforge/rapier3d-compat").RigidBody} body
 * @property {import("@dimforge/rapier3d-compat").Collider} collider
 * @property {number} lastInputSeq
 */

/** @type {{ [id: string]: ServerPlayer }} */
const players = {};

/**
 * Adds new player
 * @param {string} id
 * @param {PlayerPhysics} player
 */
function addPlayer(id, player) {
  if (players[id]) return;
  players[id] = {
    id,
    ...player,
    verticalVelocity: 0,
    lastInputSeq: 0,
    isGrounded: true,
  };
}

/**
 * Remove a player from current players
 * @param {string} id
 */
function removePlayer(id) {
  delete players[id];
}

/**
 * Returns the current players
 * @returns {{ [id: string]: ServerPlayer }}
 */
function getPlayers() {
  return players;
}

module.exports = {
  addPlayer,
  removePlayer,
  getPlayers,
};
