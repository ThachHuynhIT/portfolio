// Signs and verifies `<payload>.<hmac>` tokens using Web Crypto (crypto.subtle)
// rather than Node's `crypto` module, so the same implementation runs in both
// admin-auth.ts (Node runtime) and middleware.ts (Edge runtime) — Node has
// exposed the standard Web Crypto API globally since v20, so there's no need
// to duplicate this logic per runtime.

const encoder = new TextEncoder();

// HMAC keys are cheap but not free to import, and AUTH_SECRET never changes
// for the life of the process/isolate — cache the imported CryptoKey per
// secret instead of re-importing it on every sign/verify call.
const keyCache = new Map<string, Promise<CryptoKey>>();

function getHmacKey(secret: string): Promise<CryptoKey> {
  let key = keyCache.get(secret);
  if (!key) {
    key = crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    keyCache.set(secret, key);
  }
  return key;
}

function bytesToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Returns a plain ArrayBuffer (rather than a Uint8Array) so the result is
// always assignable to crypto.subtle.verify's BufferSource parameter —
// Uint8Array's generic buffer-type parameter (added in newer TypeScript/lib
// versions) otherwise defaults to the wider ArrayBufferLike, which newer
// BufferSource definitions reject.
function hexToBytes(hex: string): ArrayBuffer | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null;
  const buffer = new ArrayBuffer(hex.length / 2);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < view.length; i++) {
    view[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return buffer;
}

export async function signToken(payload: string, secret: string): Promise<string> {
  const key = await getHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${bytesToHex(signature)}`;
}

// Verifies the signature only (crypto.subtle.verify runs in constant time);
// callers are responsible for interpreting/validating the payload itself
// (e.g. checking an expiry timestamp encoded in it).
export async function verifyToken(token: string, secret: string): Promise<string | null> {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const signatureBytes = hexToBytes(signature);
  if (!signatureBytes) return null;

  const key = await getHmacKey(secret);
  const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(payload));
  return valid ? payload : null;
}
