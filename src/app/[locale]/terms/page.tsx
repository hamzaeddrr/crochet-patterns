import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { readSiteContent } from "@/lib/data/store";
import { pickLocalized } from "@/types";
import { pageSeoMetadata } from "@/lib/seo/page-meta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageSeoMetadata("terms", locale, "/terms", {
    title: "Terms of Use",
    description: "Terms for using Loopcraft patterns.",
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const { pages } = await readSiteContent();
  const page = pages.terms;
  const title = page?.seoTitle
    ? pickLocalized(page.seoTitle, locale)
    : "Terms of Use";
  const body = page?.body
    ? pickLocalized(page.body, locale)
    : "Patterns are for personal use unless a listing states commercial rights. Paid unlocks are for the purchaser only.";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-32 sm:px-6">
      <h1 className="font-display text-5xl text-ink">{title}</h1>
      <div className="soft-card mt-8 p-8 text-lg leading-relaxed text-muted whitespace-pre-wrap">
        {body}
      </div>
    </div>
  );
}
