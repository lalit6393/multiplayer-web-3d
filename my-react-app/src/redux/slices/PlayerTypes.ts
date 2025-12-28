export type Player = {
  id: number | string
  x: number,
  y: number,
  z: number,
}

export interface PlayerState {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  verticalVelocity: number;
  isGrounded: boolean;
  lastProcessedInputSeq: number;
}

export type Snapshot = {
  tick: number;
  players: Record<string, PlayerState>;
};