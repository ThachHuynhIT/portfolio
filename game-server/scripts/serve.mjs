// Host Tiến Lên (web + game server) from this machine.
//
//   npm run host                  # production web (`next start`) on :3000 + game server on :4000,
//                                 #   both listening on all interfaces. Builds the web app first
//                                 #   if there is no build yet (`--build` forces a rebuild).
//   npm run host -- --dev         # use `next dev` instead of a production build
//   npm run host -- --no-web      # only the game server
//   npm run share                 # same as host, plus free Cloudflare quick tunnels (no port forwarding)
//
// For friends outside your network, forward TCP 3000 and 4000 on your router to
// this machine and allow them in the Windows firewall; they then open
// http://<your-public-ip>:3000/tien-len. The page finds the game server on the
// same host automatically (port 4000).
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const serverDir = resolve(here, "..");
const repoRoot = resolve(serverDir, "..");

const args = new Set(process.argv.slice(2));
const withWeb = !args.has("--no-web");
const dev = args.has("--dev");
const withTunnel = args.has("--tunnel");
const GAME_PORT = Number(process.env.PORT) || 4000;
const WEB_PORT = Number(process.env.WEB_PORT) || 3000;
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

/** Run to completion (used for `next build`). */
function runOnce(name, cmdArgs, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = run(name, cmdArgs, cwd);
    child.on("exit", (code) => {
      children.splice(children.indexOf(child), 1);
      code === 0 ? resolveRun() : reject(new Error(`${name} failed (${code})`));
    });
  });
}

/** Long-running service: if it dies, stop everything. */
function service(name, cmdArgs, cwd, env) {
  const child = run(name, cmdArgs, cwd, env);
  child.on("exit", (code) => {
    console.log(`[${name}] exited (${code})`);
    shutdown(code ?? 1);
  });
}

async function openTunnel(port) {
  const { Tunnel, bin, install } = await import("cloudflared");
  if (!existsSync(bin)) {
    console.log("Downloading cloudflared…");
    await install(bin);
  }
  return new Promise((resolveUrl, reject) => {
    const t = Tunnel.quick(`http://localhost:${port}`);
    tunnels.push(t);
    const timer = setTimeout(() => reject(new Error(`Tunnel for :${port} did not start in 60s`)), 60_000);
    t.once("url", (url) => {
      clearTimeout(timer);
      resolveUrl(url);
    });
    t.on("error", reject);
  });
}

async function waitForPort(port, path = "/", timeoutMs = 180_000) {
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

const lanAddresses = () =>
  Object.values(networkInterfaces())
    .flat()
    .filter((a) => a && a.family === "IPv4" && !a.internal)
    .map((a) => a.address);

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
  if (withWeb && !existsSync(nextBin)) throw new Error("Run `npm install` in the repo root first.");
  if (withWeb && !dev && (args.has("--build") || !existsSync(resolve(repoRoot, ".next/BUILD_ID")))) {
    console.log("[host] Building the web app (next build)…");
    await runOnce("build", [nextBin, "build"], repoRoot);
  }

  service("game", ["--import", "tsx", "src/index.ts"], serverDir, {
    PORT: String(GAME_PORT),
    // Friends reach the page via your IP / domain, so accept any origin unless told otherwise.
    ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN ?? "*",
  });
  if (withWeb) {
    service("web", [nextBin, dev ? "dev" : "start", "-H", "0.0.0.0", "-p", String(WEB_PORT)], repoRoot);
  }

  await waitForPort(GAME_PORT, "/health");
  if (withWeb) await waitForPort(WEB_PORT, "/tien-len");

  const lines = [];
  if (withWeb) {
    lines.push("  Trên máy này:      http://localhost:" + WEB_PORT + "/tien-len");
    for (const ip of lanAddresses()) lines.push(`  Cùng mạng wifi/LAN: http://${ip}:${WEB_PORT}/tien-len`);
    lines.push(`  Qua internet:      http://<IP-public-của-bạn>:${WEB_PORT}/tien-len`);
    lines.push(`                     (cần mở port ${WEB_PORT} và ${GAME_PORT} TCP trên router + firewall)`);
  }
  if (withTunnel) {
    const [gameUrl, webUrl] = await Promise.all([openTunnel(GAME_PORT), withWeb ? openTunnel(WEB_PORT) : null]);
    const site = webUrl ?? process.env.PORTFOLIO_URL ?? "https://<your-portfolio>";
    lines.push(`  Link tunnel:       ${site.replace(/\/$/, "")}/tien-len?server=${encodeURIComponent(gameUrl)}`);
  }

  console.log(`
============================================================
  Tiến Lên đang chạy trên máy bạn — server game :${GAME_PORT}
${lines.join("\n")}
  Nhấn Ctrl+C để tắt.
============================================================
`);
}

main().catch((err) => {
  console.error("[host]", err.message);
  shutdown(1);
});
