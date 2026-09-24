import type { Card } from "./cards";
import type { LastPlay } from "./game";
import type { InstantWinReason } from "./rules";

export const MAX_NAME_LENGTH = 16;
export const TURN_SECONDS = 30;

export interface SeatView {
  /** Public id — safe to show to everyone (the secret reconnect token never leaves the server). */
  id: string;
  name: string;
  connected: boolean;
  isHost: boolean;
  /** Seat is in the current game (players who join mid-game wait for the next one). */
  inGame: boolean;
  cardCount: number;
  passed: boolean;
  wins: number;
}

export interface GameView {
  status: "playing" | "ended";
  turn: string | null;
  /** Epoch ms when the current turn auto-resolves. */
  turnDeadline: number | null;
  lastPlay: LastPlay | null;
  finished: string[];
  mustInclude: Card | null;
  instantWin: { playerId: string; reason: InstantWinReason } | null;
}

/** The full snapshot sent to one client after every change. */
export interface RoomView {
  code: string;
  meId: string;
  /** Up to 4 seats in turn order; null = empty seat. */
  seats: (SeatView | null)[];
  game: GameView | null;
  hand: Card[];
}

export interface JoinPayload {
  code: string;
  name: string;
  token: string;
}

export type AckResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };
export type Ack<T = object> = (res: AckResult<T>) => void;

export interface ClientToServerEvents {
  "room:create": (p: { name: string; token: string }, ack: Ack<{ code: string }>) => void;
  "room:join": (p: JoinPayload, ack: Ack) => void;
  "room:leave": () => void;
  "game:start": (ack: Ack) => void;
  "game:play": (p: { cards: Card[] }, ack: Ack) => void;
  "game:pass": (ack: Ack) => void;
}

export interface ServerToClientEvents {
  state: (view: RoomView) => void;
}
