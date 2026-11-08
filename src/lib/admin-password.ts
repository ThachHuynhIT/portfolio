import { randomBytes, scrypt, timingSafeEqual, type BinaryLike, type ScryptOptions } from "node:crypto";

// Admin password verification against a salted scrypt hash kept in the
// ADMIN_PASSWORD_SCRYPT env var, formatted `scrypt$<salt hex>$<key hex>`
// (16-byte salt, 64-byte key, N=16384 r=8 p=1). Generate it with
// scripts/hash-admin-password.mjs (see docs/DEPLOYMENT.md). There is
// deliberately no fallback to the old plaintext ADMIN_PASSWORD.

const SCRYPT_OPTIONS: ScryptOptions = { N: 16384, r: 8, p: 1 };
const SALT_BYTES = 16;
const KEY_BYTES = 64;
const SCRYPT_HASH = /^scrypt\$([0-9a-f]{32})\$([0-9a-f]{128})$/i;

function deriveKey(password: BinaryLike, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_BYTES, SCRYPT_OPTIONS, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

export function parseScryptHash(value: string | undefined): { salt: Buffer; key: Buffer } | null {
  const match = value ? SCRYPT_HASH.exec(value) : null;
  if (!match) return null;
  return { salt: Buffer.from(match[1], "hex"), key: Buffer.from(match[2], "hex") };
}

export async function hashAdminPassword(password: string, salt: Buffer = randomBytes(SALT_BYTES)): Promise<string> {
  const key = await deriveKey(password, salt);
  return ["scrypt", salt.toString("hex"), key.toString("hex")].join("$");
}

/**
 * Fails closed: a missing or malformed ADMIN_PASSWORD_SCRYPT makes every
 * login fail (logged without the value) rather than opening the admin panel.
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const stored = parseScryptHash(process.env.ADMIN_PASSWORD_SCRYPT);
  if (!stored) {
    console.error("ADMIN_PASSWORD_SCRYPT is missing or malformed; admin login is disabled.");
    return false;
  }
  const actual = await deriveKey(password, stored.salt);
  return actual.length === stored.key.length && timingSafeEqual(actual, stored.key);
}
