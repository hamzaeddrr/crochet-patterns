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
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
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

export function youtubeEmbedUrl(input: string | undefined | null): string | null {
  const id = parseYoutubeId(input);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
