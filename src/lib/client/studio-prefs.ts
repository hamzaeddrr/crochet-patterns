export type StudioViewMode = "dashboard" | "focus" | "list";

const PREFS_KEY = "loopcraft:studio-prefs";
const EVENT = "loopcraft:studio-prefs";

export type StudioPrefs = {
  viewMode: StudioViewMode;
};

const DEFAULTS: StudioPrefs = {
  viewMode: "dashboard",
};

function readPrefs(): StudioPrefs {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<StudioPrefs>;
    const mode = parsed.viewMode;
    return {
      viewMode:
        mode === "dashboard" || mode === "focus" || mode === "list"
          ? mode
          : DEFAULTS.viewMode,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function writePrefs(prefs: StudioPrefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

export function getStudioViewMode(): StudioViewMode {
  return readPrefs().viewMode;
}

export function setStudioViewMode(viewMode: StudioViewMode) {
  writePrefs({ ...readPrefs(), viewMode });
}

export function subscribeStudioPrefs(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
