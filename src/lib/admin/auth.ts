import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "loopcraft_admin";

function secret(): string {
  return (
    process.env.ADMIN_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "dev-only-change-me"
  );
}

export function createAdminSessionToken(): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 14;
  const payload = `admin.${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionValue(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, expStr, sig] = parts;
  if (role !== "admin") return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const payload = `${role}.${expStr}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "admin";
  return password === expected;
}
