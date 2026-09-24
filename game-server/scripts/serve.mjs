// Host the portfolio + Tiến Lên from this machine, on ONE port (default 3000).
//
//   npm run host                  # production build (built first if missing) on 0.0.0.0:3000
//   npm run host -- --build       # force a rebuild first
//   npm run host -- --dev         # next dev
//   npm run share                 # same, plus a free Cloudflare quick tunnel (no port forwarding)
//
// Friends outside your network: forward TCP 3000 on the router to this
// machine, then share http://<your-public-ip>:3000/tien-len.
// See docs/TIENLEN_SELF_HOST.md.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const serverDir = resolve(here, "..");
const repoRoot = resolve(serverDir, "..");

const args = new Set(process.argv.slice(2));
const dev = args.has("--dev");
const withTunnel = args.has("--tunnel");
const PORT = Number(process.env.PORT) || 3000;
const nextBin = resolve(repoRoot, "node_modules/next/dist/bin/next");

const children = [];
const tunnels = [];

function run(name, cmdArgs, cwd, env = {}) {
  const child = spawn(process.execPath, cmdArgs, { cwd, env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
  const prefix = `[${name}] `;
  const pipe = (stream, out) =>
    stream.on("data", (d) =>
      String(d)
        .split(/\r?\n/)
        .filter(Boolean)
        .forEach((line) => out.write(prefix + line + "\n")),
    );
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  children.push(child);
  return child;
}

function runOnce(name, cmdArgs, cwd) {
  return new Promise((ok, fail) => {
    const child = run(name, cmdArgs, cwd);
    child.on("exit", (code) => {
      children.splice(children.indexOf(child), 1);
      code === 0 ? ok() : fail(new Error(`${name} failed (${code})`));
    });
  });
}

async function openTunnel(port) {
  const { Tunnel, bin, install } = await import("cloudflared");
  if (!existsSync(bin)) {
    console.log("Downloading cloudflared…");
    await install(bin);
  }
  return new Promise((ok, fail) => {
    const t = Tunnel.quick(`http://localhost:${port}`);
    tunnels.push(t);
    const timer = setTimeout(() => fail(new Error("Tunnel did not start in 60s")), 60_000);
    t.once("url", (url) => {
      clearTimeout(timer);
      ok(url);
    });
    t.on("error", fail);
  });
}

async function waitForPort(port, path, timeoutMs = 180_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      await fetch(`http://localhost:${port}${path}`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Nothing is listening on :${port}`);
}

// Real network adapters only (skip link-local 169.254.x and VirtualBox host-only 192.168.56.x).
const lanAddresses = () =>
  Object.entries(networkInterfaces())
    .flatMap(([name, addrs]) => (addrs ?? []).map((a) => ({ name, ...a })))
    .filter((a) => a.family === "IPv4" && !a.internal && !a.address.startsWith("169.254.") && !a.address.startsWith("192.168.56.") && !/virtualbox|vmware|vethernet/i.test(a.name));

let stopping = false;
function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  tunnels.forEach((t) => t.stop());
  children.forEach((c) => c.kill());
  setTimeout(() => process.exit(code), 500);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

async function main() {
  if (!existsSync(nextBin)) throw new Error("Run `npm install` in the repo root first.");
  if (!dev && (args.has("--build") || !existsSync(resolve(repoRoot, ".next/BUILD_ID")))) {
    console.log("[host] Building the web app (next build)…");
    await runOnce("build", [nextBin, "build"], repoRoot);
  }

  const server = run("server", ["--import", "tsx", "src/index.ts", ...(dev ? ["--dev"] : [])], serverDir, {
    PORT: String(PORT),
    NODE_ENV: dev ? "development" : "production",
    // Friends reach the page via your IP / a tunnel host; accept any origin unless told otherwise.
    ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN ?? "*",
  });
  server.on("exit", (code) => {
    console.log(`[server] exited (${code})`);
    shutdown(code ?? 1);
  });

  await waitForPort(PORT, "/healthz");
  const lines = [`  Trên máy này:       http://localhost:${PORT}/tien-len`];
  for (const a of lanAddresses()) lines.push(`  Mạng ${a.name}: http://${a.address}:${PORT}/tien-len`);
  lines.push(`  Qua internet:       http://<IP-public-của-bạn>:${PORT}/tien-len  (forward TCP ${PORT} trên router)`);
  if (withTunnel) lines.push(`  Link tunnel:        ${await openTunnel(PORT)}/tien-len`);

  console.log(`
============================================================
  Tiến Lên đang chạy trên máy bạn (1 cổng: ${PORT})
${lines.join("\n")}
  Nhấn Ctrl+C để tắt.
============================================================
`);
}

main().catch((err) => {
  console.error("[host]", err.message);
  shutdown(1);
});
