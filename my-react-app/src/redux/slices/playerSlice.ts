import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { Snapshot } from "./PlayerTypes";

interface PlayerSliceState {
    snapshots: Snapshot[];
    myId: string | null;
}

const initialState: PlayerSliceState = {
    myId: null,
    snapshots: [],
};

const MAX_SNAPSHOTS = 10;

export const playerSlice = createSlice({
    name: 'player',
    initialState,
    reducers: {
        pushSnapshot: (state, action: PayloadAction<Snapshot>) => {
            state.snapshots.push(action.payload);

            if (state.snapshots.length > MAX_SNAPSHOTS) {
                state.snapshots.shift();
            }
        },
        setMyId: (state, action: PayloadAction<string>) => {
            state.myId = action.payload;
        },
    }
});

export const { pushSnapshot, setMyId } = playerSlice.actions;
export default playerSlice.reducer;