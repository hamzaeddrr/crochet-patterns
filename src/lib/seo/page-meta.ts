import type { Metadata } from "next";
import { readSiteContent } from "@/lib/data/store";
import { pickLocalized, type PageKey } from "@/types";
import type { Locale } from "@/i18n/routing";
import { siteUrl } from "@/lib/utils";

export async function pageSeoMetadata(
  key: PageKey,
  locale: string,
  path: string,
  fallback: { title: string; description: string }
): Promise<Metadata> {
  const { pages } = await readSiteContent();
  const page = pages[key];
  const loc = locale as Locale;
  const title = page?.seoTitle
    ? pickLocalized(page.seoTitle, loc) || fallback.title
    : fallback.title;
  const description = page?.seoDescription
    ? pickLocalized(page.seoDescription, loc) || fallback.description
    : fallback.description;
  const prefix = locale === "en" ? "" : `/${locale}`;
  const url = `${siteUrl()}${prefix}${path}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${siteUrl()}${path}`,
        fr: `${siteUrl()}/fr${path}`,
        es: `${siteUrl()}/es${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      images: page?.ogImage ? [{ url: siteUrl(page.ogImage) }] : undefined,
    },
  };
}
