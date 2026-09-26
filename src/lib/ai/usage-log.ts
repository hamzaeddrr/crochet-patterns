import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";
import { readJsonDocument, writeJsonDocument } from "@/lib/storage/json-store";
import {
  costFromChatUsage,
  costFromImageUsage,
  formatUsd,
  ratesForModel,
  sumCosts,
  type ChatUsageLike,
  type CostBreakdown,
  type ImageUsageLike,
} from "@/lib/ai/pricing";

const DOC = "ai-usage-log";
const MAX_ENTRIES = 500;

export type AiUsageKind = "chat" | "image";

export interface AiUsageEntry {
  id: string;
  createdAt: string;
  runId: string;
  kind: AiUsageKind;
  label: string;
  model: string;
  patternId?: string;
  quality?: string;
  size?: string;
  cost: CostBreakdown;
  rawUsage?: Record<string, unknown>;
}

export interface AiUsageStore {
  entries: AiUsageEntry[];
}

type UsageContext = {
  runId: string;
  patternId?: string;
  label?: string;
};

const als = new AsyncLocalStorage<UsageContext>();

export function getAiUsageContext(): UsageContext | undefined {
  return als.getStore();
}

export async function withAiUsageRun<T>(
  meta: { patternId?: string; label?: string; runId?: string },
  fn: () => Promise<T>
): Promise<{ result: T; runId: string }> {
  const runId = meta.runId || randomUUID();
  const result = await als.run(
    { runId, patternId: meta.patternId, label: meta.label },
    fn
  );
  return { result, runId };
}

async function readStore(): Promise<AiUsageStore> {
  return readJsonDocument<AiUsageStore>(DOC, { entries: [] });
}

async function appendEntry(entry: AiUsageEntry): Promise<void> {
  const store = await readStore();
  store.entries.unshift(entry);
  if (store.entries.length > MAX_ENTRIES) {
    store.entries = store.entries.slice(0, MAX_ENTRIES);
  }
  await writeJsonDocument(DOC, store);
}

export async function logChatUsage(opts: {
  model: string;
  label: string;
  usage?: ChatUsageLike | null;
  patternId?: string;
}): Promise<AiUsageEntry | null> {
  if (!opts.usage) return null;
  const ctx = getAiUsageContext();
  const cost = costFromChatUsage(opts.usage, ratesForModel(opts.model));
  const entry: AiUsageEntry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    runId: ctx?.runId || randomUUID(),
    kind: "chat",
    label: opts.label || ctx?.label || "chat",
    model: opts.model,
    patternId: opts.patternId || ctx?.patternId,
    cost,
    rawUsage: opts.usage as Record<string, unknown>,
  };
  try {
    await appendEntry(entry);
  } catch (err) {
    console.warn("Failed to persist AI chat usage:", err);
  }
  return entry;
}

export async function logImageUsage(opts: {
  model: string;
  label: string;
  usage?: ImageUsageLike | null;
  quality?: string;
  size?: string;
  patternId?: string;
}): Promise<AiUsageEntry | null> {
  if (!opts.usage) return null;
  const ctx = getAiUsageContext();
  const cost = costFromImageUsage(opts.usage, ratesForModel(opts.model));
  const entry: AiUsageEntry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    runId: ctx?.runId || randomUUID(),
    kind: "image",
    label: opts.label || ctx?.label || "image",
    model: opts.model,
    patternId: opts.patternId || ctx?.patternId,
    quality: opts.quality,
    size: opts.size,
    cost,
    rawUsage: opts.usage as Record<string, unknown>,
  };
  try {
    await appendEntry(entry);
  } catch (err) {
    console.warn("Failed to persist AI image usage:", err);
  }
  return entry;
}

export async function listAiUsage(limit = 200): Promise<AiUsageEntry[]> {
  const store = await readStore();
  return store.entries.slice(0, limit);
}

export type AiUsageRunSummary = {
  runId: string;
  createdAt: string;
  patternId?: string;
  labels: string[];
  models: string[];
  entries: AiUsageEntry[];
  totals: CostBreakdown;
  chatUsd: number;
  imageUsd: number;
};

export function groupUsageByRun(entries: AiUsageEntry[]): AiUsageRunSummary[] {
  const map = new Map<string, AiUsageEntry[]>();
  for (const e of entries) {
    const list = map.get(e.runId) || [];
    list.push(e);
    map.set(e.runId, list);
  }
  const runs: AiUsageRunSummary[] = [];
  for (const [runId, list] of map) {
    const sorted = [...list].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
    const totals = sumCosts(sorted.map((e) => e.cost));
    const chatUsd = round(
      sorted.filter((e) => e.kind === "chat").reduce((s, e) => s + e.cost.usd, 0)
    );
    const imageUsd = round(
      sorted
        .filter((e) => e.kind === "image")
        .reduce((s, e) => s + e.cost.usd, 0)
    );
    runs.push({
      runId,
      createdAt: sorted[0]?.createdAt || "",
      patternId: sorted.find((e) => e.patternId)?.patternId,
      labels: [...new Set(sorted.map((e) => e.label))],
      models: [...new Set(sorted.map((e) => e.model))],
      entries: sorted,
      totals,
      chatUsd,
      imageUsd,
    });
  }
  return runs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function round(n: number) {
  return Math.round(n * 1_000_000) / 1_000_000;
}

export { formatUsd };
