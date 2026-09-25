import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
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
  const t = await getTranslations({ locale, namespace: "about" });
  return pageSeoMetadata("about", locale, "/about", {
    title: t("title"),
    description: t("body"),
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const { pages } = await readSiteContent();
  const page = pages.about;
  const title = page?.heroTitle
    ? pickLocalized(page.heroTitle, locale) || t("title")
    : t("title");
  const body = page?.body
    ? pickLocalized(page.body, locale) || t("body")
    : t("body");

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-32 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
        Our story
      </p>
      <h1 className="mt-3 font-display text-5xl text-ink sm:text-6xl">
        {title}
      </h1>
      <div className="soft-card mt-8 p-8">
        <p className="text-lg leading-relaxed text-muted whitespace-pre-wrap">
          {body}
        </p>
      </div>
    </div>
  );
}
