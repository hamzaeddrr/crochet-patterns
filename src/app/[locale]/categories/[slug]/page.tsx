import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PatternCard } from "@/components/site/PatternCard";
import { Reveal } from "@/components/site/Reveal";
import { getPublishedPatterns, readSiteContent } from "@/lib/data/store";
import { pickLocalized } from "@/types";
import type { Locale } from "@/i18n/routing";
import { siteUrl } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const { categories } = await readSiteContent();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return { title: "Category" };
  const name = pickLocalized(category.name, locale as Locale);
  const description = pickLocalized(category.description, locale as Locale);
  const prefix = locale === "en" ? "" : `/${locale}`;
  return {
    title: name,
    description,
    alternates: {
      canonical: `${siteUrl()}${prefix}/categories/${slug}`,
      languages: {
        en: `${siteUrl()}/categories/${slug}`,
        fr: `${siteUrl()}/fr/categories/${slug}`,
        es: `${siteUrl()}/es/categories/${slug}`,
      },
    },
  };
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const { categories } = await readSiteContent();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const t = await getTranslations("categories");
  const patterns = (await getPublishedPatterns()).filter((p) =>
    p.categoryIds.includes(category.id)
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-32 sm:px-6">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
          Category
        </p>
        <h1 className="mt-2 font-display text-5xl text-ink sm:text-6xl">
          {pickLocalized(category.name, locale)}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          {pickLocalized(category.description, locale)}
        </p>
        <p className="mt-3 text-sm font-bold text-celadon">
          {t("count", { count: patterns.length })}
        </p>
      </Reveal>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {patterns.map((p, i) => (
          <Reveal key={p.id} delay={i * 70}>
            <PatternCard pattern={p} locale={locale} index={i} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
