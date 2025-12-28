import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import RemotePlayer from "./remotePlayers";

const OtherPlayers = () => {
  const snapshots = useSelector(
    (state: RootState) => state.player.snapshots
  );
  const myId = useSelector(
    (state: RootState) => state.player.myId
  );

  if (snapshots.length === 0) return null;

  // latest authoritative snapshot
  const latest = snapshots[snapshots.length - 1];

  return (
    <>
      {Object.keys(latest.players)
        .filter((id) => id !== myId)
        .map((id) => (
          <RemotePlayer key={id} playerId={id} />
        ))}
    </>
  );
};

export default OtherPlayers;
