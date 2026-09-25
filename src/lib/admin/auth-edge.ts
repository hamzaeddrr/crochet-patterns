/** Edge-safe admin session checks (Web Crypto). */

export const ADMIN_COOKIE = "loopcraft_admin";

function secret(): string {
  return (
    process.env.ADMIN_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "dev-only-change-me"
  );
}

async function hmacHex(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function isAdminSessionValid(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, expStr, sig] = parts;
  if (role !== "admin") return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const payload = `${role}.${expStr}`;
  const expected = await hmacHex(payload);
  if (expected.length !== sig.length) return false;
  let ok = true;
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== sig[i]) ok = false;
  }
  return ok;
}
