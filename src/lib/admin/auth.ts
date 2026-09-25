import { createHmac, timingSafeEqual } from "crypto";
import { readAdminSettings } from "@/lib/admin/settings-store";

export const ADMIN_COOKIE = "loopcraft_admin";

function secret(): string {
  return (
    process.env.ADMIN_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "dev-only-change-me"
  );
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  try {
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
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
  return safeEqual(sig, expected);
}

/**
 * Resolve login password: env wins when set (deploy source of truth).
 * Admin Settings override only applies when ADMIN_PASSWORD env is unset.
 */
export async function resolveExpectedAdminPassword(): Promise<string> {
  const fromEnv = (process.env.ADMIN_PASSWORD || "").trim();
  if (fromEnv) return fromEnv;

  try {
    const settings = await readAdminSettings();
    const fromSettings = (settings.adminPassword || "").trim();
    if (fromSettings) return fromSettings;
  } catch (err) {
    console.warn("admin settings unavailable for password check:", err);
  }

  return "admin";
}

export async function checkAdminPassword(password: string): Promise<boolean> {
  const expected = await resolveExpectedAdminPassword();
  return safeEqual(password.trim(), expected);
}
