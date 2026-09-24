// Spike: verify WebSocket support on Vercel Functions with Next.js 14 route handlers.
// Echoes every message back and reports which function instance holds the connection.
import { randomUUID } from "node:crypto";
import { experimental_upgradeWebSocket, type WebSocketData } from "@vercel/functions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// One id per function instance, to see how connections are spread across instances.
const INSTANCE_ID = randomUUID().slice(0, 8);
let connections = 0;

export async function GET(request: Request) {
  if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return Response.json(
      { ok: true, instance: INSTANCE_ID, region: process.env.VERCEL_REGION ?? "local", hint: "Connect with a WebSocket client" },
      { status: 426 },
    );
  }

  try {
    return await experimental_upgradeWebSocket((ws) => {
      connections++;
      const openedAt = Date.now();
      ws.send(
        JSON.stringify({
          type: "hello",
          instance: INSTANCE_ID,
          region: process.env.VERCEL_REGION ?? "local",
          connectionsOnInstance: connections,
        }),
      );
      ws.on("message", (data: WebSocketData) => {
        ws.send(JSON.stringify({ type: "echo", data: data.toString(), instance: INSTANCE_ID, uptimeMs: Date.now() - openedAt }));
      });
      ws.on("close", () => {
        connections--;
      });
    });
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 501 });
  }
}
