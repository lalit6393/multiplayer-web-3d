const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const { createWorld } = require("./src/physics/world");
const { registerSockets } = require("./src/network/socket");
const { getPlayers } = require("./src/players/players");
const { startPhysicsLoop } = require("./src/physics/physicsLoops");
const { startSnapshotLoop } = require("./src/network/snapShots");

const PORT = process.env.PORT || 3000;

async function startServer() {
  // wait until Rapier + world are ready
  const { world, RAPIER } = await createWorld();

  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.use((socket, next) => {
    if (Object.keys(getPlayers()).length >= 30) {
      return next(new Error("SERVER_FULL"));
    }
    next();
  });

  // register socket events
  registerSockets(io, world, RAPIER);

  // Physics (60 Hz)
  startPhysicsLoop(world, io, RAPIER);

  // Network snapshots (20 Hz)
  startSnapshotLoop(io);

  server.listen(PORT, () => {
    console.log("Server listening on " + PORT);
  });
}

startServer();
