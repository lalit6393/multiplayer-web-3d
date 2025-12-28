import { pushSnapshot, setMyId } from "../redux/slices/playerSlice";
import type { Snapshot } from "../redux/slices/PlayerTypes";
import type { AppDispatch } from "../redux/store";
import { socket } from "../socket";

export const startNetworkSync = async (dispatch: AppDispatch) => {
  socket.connect();

  socket.on("connect", () => {
    console.log("Connected:", socket.id);
    if (socket.id) {
      dispatch(setMyId(socket.id));
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected");
  });

  // Single authoritative update path
  socket.on("snapshot", (snapshot: Snapshot) => {
    dispatch(pushSnapshot(snapshot));
  });

  socket.on("connect_error", (err) => {
    if (err.message === "SERVER_FULL") {
      alert("Server is full (30 players max)");
    }
  });
};
