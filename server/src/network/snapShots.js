const { getPlayers } = require("../players/players");

function broadcastSnapshots(io) {
  const players = getPlayers();

  const snapshot = {
    tick: Date.now(),
    players: Object.fromEntries(
      Object.entries(players).map(([id, p]) => [
        id,
        {
          position: p.body.translation(),
          rotation: p.body.rotation(),
          verticalVelocity: p.verticalVelocity,
          lastProcessedInputSeq: p.lastInputSeq,
        },
      ])
    ),
  };

  io.emit("snapshot", snapshot);
}

function startSnapshotLoop(io) {
  // 20 Hz snapshot rate (very common)
  setInterval(() => {
    broadcastSnapshots(io);
  }, 50);
}

module.exports = { startSnapshotLoop };
