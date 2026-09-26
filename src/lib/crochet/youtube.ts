/** Extract an 11-char YouTube video id from a URL or raw id. */
export function parseYoutubeId(input: string | undefined | null): string | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com"
    ) {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const embed = u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{11})/);
      if (embed) return embed[1];
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Parse YouTube timestamp like 1m30s, 90, 1:30 into seconds. */
export function parseTimestampToSeconds(
  input: string | number | undefined | null
): number | undefined {
  if (input === undefined || input === null || input === "") return undefined;
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input < 0) return undefined;
    return Math.floor(input);
  }
  const s = String(input).trim().toLowerCase();
  if (!s) return undefined;
  if (/^\d+$/.test(s)) return Math.floor(Number(s));

  const hms = s.match(/^(?:(\d+):)?(\d+):(\d+)$/);
  if (hms) {
    const h = Number(hms[1] || 0);
    const m = Number(hms[2]);
    const sec = Number(hms[3]);
    return h * 3600 + m * 60 + sec;
  }

  let total = 0;
  const h = s.match(/(\d+)\s*h/);
  const m = s.match(/(\d+)\s*m/);
  const sec = s.match(/(\d+)\s*s/);
  if (h) total += Number(h[1]) * 3600;
  if (m) total += Number(m[1]) * 60;
  if (sec) total += Number(sec[1]);
  if (h || m || sec) return total;

  const tOnly = s.match(/^t=(\d+)/);
  if (tOnly) return Number(tOnly[1]);

  return undefined;
}

/** Read start time from a watch URL (?t= or &start=). */
export function parseStartFromYoutubeUrl(
  input: string | undefined | null
): number | undefined {
  if (!input) return undefined;
  try {
    const u = new URL(input.trim());
    const start = u.searchParams.get("start");
    if (start) return parseTimestampToSeconds(start);
    const t = u.searchParams.get("t");
    if (t) return parseTimestampToSeconds(t.replace(/s$/i, ""));
  } catch {
    /* ignore */
  }
  return undefined;
}

export function youtubeEmbedUrl(
  input: string | undefined | null,
  opts?: { startSeconds?: number | null; endSeconds?: number | null }
): string | null {
  const id = parseYoutubeId(input);
  if (!id) return null;

  const params = new URLSearchParams();
  const start =
    opts?.startSeconds != null && opts.startSeconds > 0
      ? Math.floor(opts.startSeconds)
      : parseStartFromYoutubeUrl(input);
  const end =
    opts?.endSeconds != null && opts.endSeconds > 0
      ? Math.floor(opts.endSeconds)
      : undefined;

  if (start != null && start > 0) params.set("start", String(start));
  if (end != null && end > 0 && (start == null || end > start)) {
    params.set("end", String(end));
  }
  // Modest branding; still official YouTube player
  params.set("rel", "0");

  const qs = params.toString();
  return `https://www.youtube.com/embed/${id}${qs ? `?${qs}` : ""}`;
}
