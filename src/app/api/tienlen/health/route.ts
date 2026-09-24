// Diagnostics for the Tiến Lên room store: which backend is active and whether a
// create → load → save → pub/sub round trip works (with timings). No secrets are returned.
import { newRoom, randomCode } from "@/lib/tienlen/room";
import { getRoomStore, redisUrl } from "@/lib/tienlen/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const withTimeout = <T,>(p: Promise<T>, ms: number, label: string) =>
  Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms))]);

export async function GET() {
  const steps: Record<string, number | string> = {};
  const t = () => Date.now();
  let start = t();
  const mark = (name: string) => {
    steps[name] = t() - start;
    start = t();
  };
  const configured = redisUrl();
  const info = {
    region: process.env.VERCEL_REGION ?? "local",
    redisConfigured: !!configured,
    redisHost: configured ? new URL(configured).hostname : null,
  };

  try {
    const store = await withTimeout(getRoomStore(), 5000, "connect");
    mark("init");
    const code = "HC" + randomCode(6);
    await withTimeout(store.create(newRoom(code)), 5000, "create");
    mark("create");
    const loaded = await withTimeout(store.load(code), 5000, "load");
    mark("load");
    if (!loaded) throw new Error("load returned nothing right after create");
    let notified = false;
    const gotMessage = new Promise<void>((resolve) => {
      void store.subscribe(code, () => {
        notified = true;
        resolve();
      }).then((unsub) => setTimeout(unsub, 3000));
    });
    await new Promise((r) => setTimeout(r, 300)); // let SUBSCRIBE settle
    mark("subscribe");
    const saved = await withTimeout(store.save(loaded.state, loaded.version), 5000, "save");
    mark("save");
    await withTimeout(gotMessage, 3000, "pubsub").catch(() => {});
    mark("pubsub");
    return Response.json({ ok: saved && notified, store: store.kind, saved, notified, stepsMs: steps, ...info });
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err), stepsMs: steps, ...info }, { status: 500 });
  }
}
