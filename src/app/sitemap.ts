import type { MetadataRoute } from "next";
import { getPublishedPatterns, readSiteContent } from "@/lib/data/store";
import { siteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const locales = ["en", "fr", "es"] as const;
  const staticPaths = [
    "",
    "/patterns",
    "/categories",
    "/about",
    "/contact",
    "/blog",
    "/privacy",
    "/terms",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    const prefix = locale === "en" ? "" : `/${locale}`;
    for (const path of staticPaths) {
      entries.push({
        url: `${base}${prefix}${path || "/"}`,
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.7,
      });
    }
  }

  const patterns = await getPublishedPatterns();
  for (const p of patterns) {
    for (const locale of locales) {
      const prefix = locale === "en" ? "" : `/${locale}`;
      entries.push({
        url: `${base}${prefix}/patterns/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  const { categories } = await readSiteContent();
  for (const c of categories) {
    for (const locale of locales) {
      const prefix = locale === "en" ? "" : `/${locale}`;
      entries.push({
        url: `${base}${prefix}/categories/${c.slug}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
