import { createHmac, timingSafeEqual, randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { PurchaseRecord } from "@/types";

export const UNLOCK_COOKIE = "loopcraft_unlock";

function unlockSecret(): string {
  return (
    process.env.ADMIN_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    "dev-unlock-secret"
  );
}

/** Cookie value packs multiple pattern unlocks: id:exp,id:exp.sig */
export function createUnlockToken(
  patternId: string,
  existingToken?: string,
  days = 365
): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * days;
  const map = parseUnlockMap(existingToken);
  map.set(patternId, exp);
  const payload = [...map.entries()]
    .map(([id, e]) => `${id}:${e}`)
    .join(",");
  const sig = createHmac("sha256", unlockSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function parseUnlockMap(token: string | undefined): Map<string, number> {
  const map = new Map<string, number>();
  if (!token) return map;
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return map;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = createHmac("sha256", unlockSecret())
    .update(payload)
    .digest("hex");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return map;
  } catch {
    return map;
  }
  for (const part of payload.split(",")) {
    const [id, expStr] = part.split(":");
    const exp = Number(expStr);
    if (id && Number.isFinite(exp) && Date.now() <= exp) {
      map.set(id, exp);
    }
  }
  return map;
}

export function isPatternUnlocked(
  token: string | undefined,
  patternId: string
): boolean {
  return parseUnlockMap(token).has(patternId);
}

const DATA_DIR = path.join(process.cwd(), "data");
const PURCHASES_FILE = path.join(DATA_DIR, "purchases.json");

async function ensurePurchases(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(PURCHASES_FILE);
  } catch {
    await fs.writeFile(PURCHASES_FILE, "[]", "utf8");
  }
}

export async function readPurchases(): Promise<PurchaseRecord[]> {
  await ensurePurchases();
  const raw = await fs.readFile(PURCHASES_FILE, "utf8");
  return JSON.parse(raw) as PurchaseRecord[];
}

export async function recordPurchase(
  input: Omit<PurchaseRecord, "id" | "unlockedAt"> & { unlockedAt?: string }
): Promise<PurchaseRecord> {
  const list = await readPurchases();
  const existing = list.find((p) => p.sessionId === input.sessionId);
  if (existing) return existing;
  const record: PurchaseRecord = {
    id: randomUUID(),
    patternId: input.patternId,
    patternSlug: input.patternSlug,
    sessionId: input.sessionId,
    email: input.email,
    amountCents: input.amountCents,
    currency: input.currency,
    unlockedAt: input.unlockedAt || new Date().toISOString(),
  };
  list.unshift(record);
  await fs.writeFile(PURCHASES_FILE, JSON.stringify(list, null, 2), "utf8");
  return record;
}

export async function hasPurchaseForPattern(
  patternId: string,
  sessionId?: string
): Promise<boolean> {
  const list = await readPurchases();
  if (sessionId) {
    return list.some(
      (p) => p.patternId === patternId && p.sessionId === sessionId
    );
  }
  return list.some((p) => p.patternId === patternId);
}
