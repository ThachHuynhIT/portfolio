import { randomBytes } from "node:crypto";
import {
  type ActionResult,
  type Card,
  type GameState,
  MAX_NAME_LENGTH,
  MAX_PLAYERS,
  MIN_PLAYERS,
  type RoomView,
  TURN_SECONDS,
  autoAction,
  newGame,
  pass,
  play,
} from "../../src/lib/tienlen";

/** How long a disconnected player keeps their seat. */
const RECONNECT_GRACE_MS = 60_000;
/** Delay before auto-playing for a disconnected player whose turn it is. */
const ABSENT_TURN_MS = 2_000;
/** Empty rooms are deleted after this long. */
const EMPTY_ROOM_TTL_MS = 10 * 60_000;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export interface Player {
  id: string;
  token: string;
  name: string;
  socketId: string | null;
  wins: number;
  leaveTimer?: NodeJS.Timeout;
}

export interface Room {
  code: string;
  hostId: string;
  seats: (Player | null)[];
  game: GameState | null;
  turnDeadline: number | null;
  turnTimer?: NodeJS.Timeout;
  cleanupTimer?: NodeJS.Timeout;
  /** Winner of the last finished game leads the next one. */
  lastWinner: string | null;
}

export type Broadcast = (room: Room) => void;

const randomId = (len: number, alphabet = CODE_ALPHABET) => {
  const bytes = randomBytes(len);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
};

export const cleanName = (name: unknown) =>
  (typeof name === "string" ? name : "").replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH) || "Người chơi";

export class RoomManager {
  private rooms = new Map<string, Room>();

  constructor(private broadcast: Broadcast) {}

  get(code: string) {
    return this.rooms.get(String(code).toUpperCase());
  }

  create(): Room {
    let code: string;
    do code = randomId(5);
    while (this.rooms.has(code));
    const room: Room = { code, hostId: "", seats: [null, null, null, null], game: null, turnDeadline: null, lastWinner: null };
    this.rooms.set(code, room);
    this.scheduleCleanup(room);
    return room;
  }

  /** Seat a player (or re-attach a returning one by token). */
  join(room: Room, token: string, name: string, socketId: string): { ok: true; player: Player } | { ok: false; error: string } {
    if (typeof token !== "string" || token.length < 8) return { ok: false, error: "Phiên không hợp lệ" };
    let player = room.seats.find((p) => p?.token === token) ?? null;
    if (player) {
      clearTimeout(player.leaveTimer);
      player.leaveTimer = undefined;
      if (!room.game || room.game.status !== "playing") player.name = cleanName(name);
    } else {
      const free = room.seats.findIndex((s) => s === null);
      if (free < 0) return { ok: false, error: "Phòng đã đủ 4 người" };
      player = { id: randomId(8), token, name: cleanName(name), socketId, wins: 0 };
      room.seats[free] = player;
    }
    player.socketId = socketId;
    if (!room.hostId || !this.findPlayer(room, room.hostId)) room.hostId = player.id;
    clearTimeout(room.cleanupTimer);
    // A returning player gets a fresh full timer if it is their turn.
    if (room.game?.turn === player.id) room.turnDeadline = null;
    this.onTurnChanged(room);
    this.broadcast(room);
    return { ok: true, player };
  }

  /** Socket dropped: keep the seat for a grace period. */
  disconnect(room: Room, player: Player) {
    player.socketId = null;
    clearTimeout(player.leaveTimer);
    player.leaveTimer = setTimeout(() => this.remove(room, player), RECONNECT_GRACE_MS);
    this.onTurnChanged(room);
    this.broadcast(room);
  }

  /** Remove a player from the room. Mid-game they stay in the hand and are auto-played. */
  remove(room: Room, player: Player) {
    clearTimeout(player.leaveTimer);
    player.leaveTimer = undefined;
    player.socketId = null;
    const playing = room.game?.status === "playing" && room.game.players.includes(player.id);
    if (!playing) {
      const idx = room.seats.indexOf(player);
      if (idx >= 0) room.seats[idx] = null;
    }
    if (room.hostId === player.id) {
      room.hostId = room.seats.find((p) => p && p.socketId)?.id ?? room.seats.find((p) => p)?.id ?? "";
    }
    this.onTurnChanged(room);
    this.broadcast(room);
    this.scheduleCleanup(room);
  }

  start(room: Room, player: Player): ActionResult {
    if (room.hostId !== player.id) return { ok: false, error: "Chỉ chủ phòng mới bắt đầu được" };
    if (room.game?.status === "playing") return { ok: false, error: "Ván đang diễn ra" };
    this.dropAbsentSeats(room);
    const players = room.seats.filter((p): p is Player => !!p).map((p) => p.id);
    if (players.length < MIN_PLAYERS) return { ok: false, error: `Cần ít nhất ${MIN_PLAYERS} người` };
    if (players.length > MAX_PLAYERS) return { ok: false, error: "Quá nhiều người" };
    const starter = room.lastWinner && players.includes(room.lastWinner) ? room.lastWinner : undefined;
    room.game = newGame(players, { starter });
    this.afterAction(room);
    return { ok: true };
  }

  play(room: Room, player: Player, cards: Card[]): ActionResult {
    if (!room.game) return { ok: false, error: "Chưa bắt đầu ván" };
    const clean = Array.isArray(cards) ? cards.filter((c) => Number.isInteger(c) && c >= 0 && c < 52) : [];
    const res = play(room.game, player.id, clean);
    if (res.ok) this.afterAction(room);
    return res;
  }

  pass(room: Room, player: Player): ActionResult {
    if (!room.game) return { ok: false, error: "Chưa bắt đầu ván" };
    const res = pass(room.game, player.id);
    if (res.ok) this.afterAction(room);
    return res;
  }

  view(room: Room, player: Player): RoomView {
    const g = room.game;
    return {
      code: room.code,
      meId: player.id,
      seats: room.seats.map((p) =>
        p
          ? {
              id: p.id,
              name: p.name,
              connected: !!p.socketId,
              isHost: room.hostId === p.id,
              inGame: !!g?.players.includes(p.id),
              cardCount: g?.hands[p.id]?.length ?? 0,
              passed: !!g?.passed.includes(p.id),
              wins: p.wins,
            }
          : null,
      ),
      game: g
        ? {
            status: g.status,
            turn: g.turn,
            turnDeadline: room.turnDeadline,
            lastPlay: g.lastPlay,
            finished: g.finished,
            mustInclude: g.mustInclude,
            instantWin: g.instantWin,
          }
        : null,
      hand: g?.hands[player.id] ?? [],
    };
  }

  findPlayer(room: Room, id: string) {
    return room.seats.find((p) => p?.id === id) ?? null;
  }

  private afterAction(room: Room) {
    const g = room.game;
    room.turnDeadline = null; // new turn → fresh timer
    if (g?.status === "ended") {
      room.lastWinner = g.finished[0] ?? null;
      const winner = room.lastWinner && this.findPlayer(room, room.lastWinner);
      if (winner) winner.wins++;
      this.dropAbsentSeats(room);
    }
    this.onTurnChanged(room);
    this.broadcast(room);
  }

  /** (Re)arm the turn timer. Disconnected players are auto-played quickly. */
  private onTurnChanged(room: Room) {
    clearTimeout(room.turnTimer);
    const g = room.game;
    if (!g || g.status !== "playing" || !g.turn) {
      room.turnDeadline = null;
      return;
    }
    const turnPlayer = this.findPlayer(room, g.turn);
    const absent = !turnPlayer || !turnPlayer.socketId;
    const now = Date.now();
    // Keep the existing deadline if the same turn is just being re-evaluated (e.g. a reconnect).
    const ms = absent ? ABSENT_TURN_MS : TURN_SECONDS * 1000;
    if (!room.turnDeadline || room.turnDeadline < now || absent) room.turnDeadline = now + ms;
    const turn = g.turn;
    room.turnTimer = setTimeout(() => {
      if (room.game?.turn !== turn) return;
      room.turnDeadline = null;
      autoAction(room.game, turn);
      this.afterAction(room);
    }, room.turnDeadline - now);
  }

  /** Between games, free seats whose owners are gone. */
  private dropAbsentSeats(room: Room) {
    room.seats = room.seats.map((p) => (p && !p.socketId && !p.leaveTimer ? null : p));
  }

  private scheduleCleanup(room: Room) {
    if (room.seats.some((p) => p?.socketId)) return;
    clearTimeout(room.cleanupTimer);
    room.cleanupTimer = setTimeout(() => {
      if (room.seats.some((p) => p?.socketId)) return;
      clearTimeout(room.turnTimer);
      room.seats.forEach((p) => p && clearTimeout(p.leaveTimer));
      this.rooms.delete(room.code);
    }, EMPTY_ROOM_TTL_MS);
  }
}
