const PROGRESS_KEY = "loopcraft:progress";

/** patternId → componentId → completed round numbers */
export type ProgressStore = Record<string, Record<string, number[]>>;

function readStore(): ProgressStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProgressStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: ProgressStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event("loopcraft:progress"));
  } catch {
    /* ignore */
  }
}

export function getCompletedRounds(
  patternId: string,
  componentId: string
): number[] {
  return readStore()[patternId]?.[componentId] || [];
}

export function isRoundComplete(
  patternId: string,
  componentId: string,
  round: number
): boolean {
  return getCompletedRounds(patternId, componentId).includes(round);
}

export function toggleRoundComplete(
  patternId: string,
  componentId: string,
  round: number
): boolean {
  const store = readStore();
  const byComp = { ...(store[patternId] || {}) };
  const set = new Set(byComp[componentId] || []);
  if (set.has(round)) set.delete(round);
  else set.add(round);
  byComp[componentId] = [...set].sort((a, b) => a - b);
  store[patternId] = byComp;
  writeStore(store);
  return set.has(round);
}

export function getPatternProgressSummary(
  patternId: string,
  totalRounds: number
): { done: number; total: number } {
  const byComp = readStore()[patternId] || {};
  const done = Object.values(byComp).reduce((n, rounds) => n + rounds.length, 0);
  return { done, total: totalRounds };
}
