import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PatternCard } from "@/components/site/PatternCard";
import { Reveal } from "@/components/site/Reveal";
import { getPublishedPatterns } from "@/lib/data/store";
import type { Locale } from "@/i18n/routing";
import { siteUrl } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "patterns" });
  const prefix = locale === "en" ? "" : `/${locale}`;
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `${siteUrl()}${prefix}/patterns`,
      languages: {
        en: `${siteUrl()}/patterns`,
        fr: `${siteUrl()}/fr/patterns`,
        es: `${siteUrl()}/es/patterns`,
      },
    },
  };
}

export default async function PatternsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("patterns");
  const patterns = await getPublishedPatterns();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-32 sm:px-6">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
          Collection
        </p>
        <h1 className="mt-2 font-display text-5xl text-ink sm:text-6xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">{t("subtitle")}</p>
      </Reveal>
      {patterns.length === 0 ? (
        <div className="soft-card mt-12 p-10 text-center text-muted">
          {t("empty")}
        </div>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {patterns.map((p, i) => (
            <Reveal key={p.id} delay={i * 70}>
              <PatternCard pattern={p} locale={locale} index={i} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
