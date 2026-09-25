import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function siteUrl(path = ""): string {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${base}${p}`;
}

/** Append a version query so browsers / Next Image never show a stale asset. */
export function versionedAssetUrl(
  url: string | undefined,
  version?: string | number | null
): string | undefined {
  if (!url) return undefined;
  if (version == null || version === "") return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(String(version))}`;
}

