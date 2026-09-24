import { createServer } from "node:http";
import { Server } from "socket.io";
import type { AckResult, ClientToServerEvents, ServerToClientEvents } from "../../src/lib/tienlen";
import { RoomManager } from "./rooms";

const PORT = Number(process.env.PORT) || 4000;
/**
 * Comma-separated list of allowed web origins. `*` wildcards match one or more
 * host labels, e.g. "https://example.com,https://*.vercel.app". The default
 * covers local dev and quick Cloudflare tunnels (`npm run share`).
 */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN ?? "http://localhost:3000,https://*.trycloudflare.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const originPatterns = ALLOWED_ORIGINS.map(
  (o) => new RegExp(`^${o.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[a-z0-9-.]+")}$`, "i"),
);
const isAllowedOrigin = (origin: string | undefined) =>
  !origin || ALLOWED_ORIGINS.includes("*") || originPatterns.some((re) => re.test(origin));

interface SocketData {
  roomCode?: string;
  playerId?: string;
}

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404).end();
});

const io = new Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>(httpServer, {
  cors: { origin: (origin, cb) => cb(null, isAllowedOrigin(origin)) },
  // WebSocket upgrades skip CORS, so check the origin there too.
  allowRequest: (req, cb) => cb(null, isAllowedOrigin(req.headers.origin)),
});

const rooms = new RoomManager((room) => {
  for (const p of room.seats) {
    if (p?.socketId) io.to(p.socketId).emit("state", rooms.view(room, p));
  }
});

/** Ack helper that tolerates clients that did not pass a callback. */
const reply = <T extends object>(ack: unknown, res: AckResult<T>) => {
  if (typeof ack === "function") ack(res);
};

io.on("connection", (socket) => {
  const current = () => {
    const { roomCode, playerId } = socket.data;
    const room = roomCode ? rooms.get(roomCode) : undefined;
    const player = room && playerId ? rooms.findPlayer(room, playerId) : null;
    return room && player && player.socketId === socket.id ? { room, player } : null;
  };

  const leaveCurrent = () => {
    const ctx = current();
    if (ctx) rooms.remove(ctx.room, ctx.player);
    socket.data = {};
  };

  socket.on("room:create", (_payload, ack) => {
    const room = rooms.create();
    reply(ack, { ok: true, code: room.code });
  });

  socket.on("room:join", (payload, ack) => {
    const room = rooms.get(payload?.code ?? "");
    if (!room) return reply(ack, { ok: false, error: "Không tìm thấy phòng" });
    const prev = current();
    if (prev && prev.room !== room) leaveCurrent();
    const res = rooms.join(room, payload.token, payload.name, socket.id);
    if (!res.ok) return reply(ack, res);
    socket.data = { roomCode: room.code, playerId: res.player.id };
    reply(ack, { ok: true });
  });

  socket.on("room:leave", leaveCurrent);

  socket.on("game:start", (ack) => {
    const ctx = current();
    if (!ctx) return reply(ack, { ok: false, error: "Bạn chưa vào phòng" });
    reply(ack, rooms.start(ctx.room, ctx.player));
  });

  socket.on("game:play", (payload, ack) => {
    const ctx = current();
    if (!ctx) return reply(ack, { ok: false, error: "Bạn chưa vào phòng" });
    reply(ack, rooms.play(ctx.room, ctx.player, payload?.cards));
  });

  socket.on("game:pass", (ack) => {
    const ctx = current();
    if (!ctx) return reply(ack, { ok: false, error: "Bạn chưa vào phòng" });
    reply(ack, rooms.pass(ctx.room, ctx.player));
  });

  socket.on("disconnect", () => {
    const ctx = current();
    if (ctx) rooms.disconnect(ctx.room, ctx.player);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[tienlen] listening on :${PORT} — allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
});
