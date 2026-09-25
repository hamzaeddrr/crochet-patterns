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
  const p = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${base}${p}`;
}
