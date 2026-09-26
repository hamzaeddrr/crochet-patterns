const FAV_KEY = "loopcraft:favorites";
const RECENT_KEY = "loopcraft:recent";
const MAX_RECENT = 24;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("loopcraft:library"));
  } catch {
    /* quota / private mode */
  }
}

export function getFavoriteIds(): string[] {
  const ids = readJson<string[]>(FAV_KEY, []);
  return Array.isArray(ids) ? ids.filter(Boolean) : [];
}

export function isFavorite(patternId: string): boolean {
  return getFavoriteIds().includes(patternId);
}

export function toggleFavorite(patternId: string): boolean {
  const ids = getFavoriteIds();
  const next = ids.includes(patternId)
    ? ids.filter((id) => id !== patternId)
    : [patternId, ...ids];
  writeJson(FAV_KEY, next);
  return next.includes(patternId);
}

export type RecentEntry = { id: string; viewedAt: string };

export function getRecentEntries(): RecentEntry[] {
  const list = readJson<RecentEntry[]>(RECENT_KEY, []);
  return Array.isArray(list) ? list.filter((e) => e?.id) : [];
}

export function trackRecentView(patternId: string) {
  const now = new Date().toISOString();
  const next = [
    { id: patternId, viewedAt: now },
    ...getRecentEntries().filter((e) => e.id !== patternId),
  ].slice(0, MAX_RECENT);
  writeJson(RECENT_KEY, next);
}
