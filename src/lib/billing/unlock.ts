import { createHmac, timingSafeEqual, randomUUID } from "crypto";
import type { PurchaseRecord } from "@/types";
import { readJsonDocument, writeJsonDocument } from "@/lib/storage/json-store";

export const UNLOCK_COOKIE = "loopcraft_unlock";

const DOC = "purchases";

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

export async function readPurchases(): Promise<PurchaseRecord[]> {
  return readJsonDocument<PurchaseRecord[]>(DOC, []);
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
  await writeJsonDocument(DOC, list);
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
