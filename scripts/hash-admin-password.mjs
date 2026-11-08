#!/usr/bin/env node
// Prints an ADMIN_PASSWORD_SCRYPT value: scrypt$<16-byte salt hex>$<64-byte key hex>
// (N=16384, r=8, p=1 — must match src/lib/admin-password.ts).
//
// The password is read from the PORTFOLIO_PASSWORD_ONCE env var, or else from
// stdin (hidden prompt on a terminal, or piped input). It is never accepted
// as a command-line argument, so it does not end up in shell history or the
// process list. Only the hash is printed (stdout); put it in your local env /
// deployment settings, never in the repo.
//
//   node scripts/hash-admin-password.mjs

import { randomBytes, scrypt } from "node:crypto";

if (process.argv.length > 2) {
  console.error("Do not pass the password as an argument. Use PORTFOLIO_PASSWORD_ONCE or stdin.");
  process.exit(1);
}

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    const { stdin, stderr } = process;
    let value = "";
    stderr.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const finish = (err) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      stderr.write("\n");
      if (err) reject(err);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") return finish();
        if (char === "\u0003") return finish(new Error("Cancelled."));
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else value += char;
      }
    };
    stdin.on("data", onData);
  });
}

async function readPiped() {
  let data = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) data += chunk;
  return data.replace(/\r?\n$/, "");
}

async function readPassword() {
  const fromEnv = process.env.PORTFOLIO_PASSWORD_ONCE;
  if (fromEnv) return fromEnv;
  return process.stdin.isTTY ? readHidden("Admin password: ") : readPiped();
}

try {
  const password = await readPassword();
  if (!password.trim()) throw new Error("Password must not be blank.");
  const salt = randomBytes(16);
  const key = await new Promise((resolve, reject) =>
    scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derived) => (err ? reject(err) : resolve(derived)))
  );
  console.log(["scrypt", salt.toString("hex"), key.toString("hex")].join("$"));
} catch (err) {
  console.error(err instanceof Error ? err.message : "Failed to hash password.");
  process.exit(1);
}
