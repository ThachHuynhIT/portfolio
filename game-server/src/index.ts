// Self-hosted Tiến Lên: serves the whole portfolio (Next.js) and the game
// WebSocket on ONE port, so only that port needs forwarding.
//
//   PORT=3000 NODE_ENV=production tsx src/index.ts   # after `next build` in the repo root
//   tsx src/index.ts --dev                           # next dev
//
// Rooms are kept in memory unless REDIS_URL / KV_URL is set.
import { type IncomingMessage, createServer } from "node:http";
import type { Duplex } from "node:stream";
import { resolve } from "node:path";
import next from "next";
import { WebSocketServer } from "ws";
import { WS_PATH } from "../../src/lib/tienlen/protocol";
import { MAX_MESSAGE_BYTES, attachConnection, isAllowedOrigin } from "../../src/lib/tienlen/server/hub";
import { getRoomStore } from "../../src/lib/tienlen/server/store";

const dev = process.argv.includes("--dev");
const port = Number(process.env.PORT) || 3000;
const hostname = process.env.HOST || "0.0.0.0";
const repoRoot = resolve(__dirname, "../..");

const pathOf = (req: IncomingMessage) => new URL(req.url ?? "/", "http://localhost").pathname;

async function main() {
  const app = next({ dev, dir: repoRoot, hostname, port });
  await app.prepare();
  const handle = app.getRequestHandler();
  const nextUpgrade = app.getUpgradeHandler();
  const store = await getRoomStore();

  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE_BYTES });
  const server = createServer((req, res) => {
    if (req.url === "/healthz") {
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ ok: true, store: store.kind }));
      return;
    }
    void handle(req, res);
  });

  const onUpgrade = (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    if (pathOf(req) !== WS_PATH) {
      void nextUpgrade(req, socket, head); // e.g. HMR in dev
      return;
    }
    if (!isAllowedOrigin(req.headers.origin, req.headers.host)) {
      socket.end("HTTP/1.1 403 Forbidden\r\n\r\n");
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => attachConnection(ws));
  };
  server.on("upgrade", onUpgrade);

  // On its first request Next attaches its own "upgrade" listener to req.socket.server,
  // which ends every socket it does not own — including ours. Keep only onUpgrade
  // (it already forwards non-game upgrades to Next).
  const addListener = server.on.bind(server) as (event: string, listener: (...args: unknown[]) => void) => typeof server;
  const guard = ((event: string, listener: (...args: unknown[]) => void) =>
    event === "upgrade" && listener !== (onUpgrade as unknown) ? server : addListener(event, listener)) as typeof server.on;
  server.on = guard;
  server.addListener = guard;

  server.listen(port, hostname, () => {
    console.log(`[tienlen] ready on http://localhost:${port} (${dev ? "dev" : "production"}, rooms: ${store.kind})`);
  });
}

main().catch((err) => {
  console.error("[tienlen]", err);
  process.exit(1);
});
