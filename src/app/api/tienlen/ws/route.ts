// Tiến Lên realtime endpoint on Vercel Functions (WebSockets, beta).
// Room state lives in Redis (REDIS_URL / KV_URL) so players can sit on different instances.
// When self-hosting, game-server/src/index.ts handles upgrades on this same path instead.
import { experimental_upgradeWebSocket, getDeadline } from "@vercel/functions";
import { MAX_MESSAGE_BYTES, attachConnection, isAllowedOrigin } from "@/lib/tienlen/server/hub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return Response.json({ ok: false, error: "Expected a WebSocket connection" }, { status: 426 });
  }
  if (!isAllowedOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return Response.json({ ok: false, error: "Origin not allowed" }, { status: 403 });
  }
  // Read the invocation deadline before upgrading, while the request context is current.
  const deadline = getDeadline();
  return experimental_upgradeWebSocket((ws) => attachConnection(ws, { deadline }), { maxPayload: MAX_MESSAGE_BYTES });
}
