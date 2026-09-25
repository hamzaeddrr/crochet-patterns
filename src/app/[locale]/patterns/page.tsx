import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PatternCard } from "@/components/site/PatternCard";
import { Reveal } from "@/components/site/Reveal";
import { getPublishedPatterns, readSiteContent } from "@/lib/data/store";
import { pickLocalized } from "@/types";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { pageSeoMetadata } from "@/lib/seo/page-meta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "patterns" });
  return pageSeoMetadata("patterns", locale, "/patterns", {
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function PatternsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; access?: string }>;
}) {
  const { locale: localeParam } = await params;
  const { category: categorySlug, access } = await searchParams;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("patterns");
  const { categories } = await readSiteContent();
  let patterns = await getPublishedPatterns();

  if (categorySlug) {
    const cat = categories.find((c) => c.slug === categorySlug);
    if (cat) {
      patterns = patterns.filter((p) => p.categoryIds.includes(cat.id));
    }
  }
  if (access === "free") {
    patterns = patterns.filter((p) => p.free);
  } else if (access === "paid") {
    patterns = patterns.filter((p) => !p.free);
  }

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

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/patterns"
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            !categorySlug && !access
              ? "bg-apricot text-bone"
              : "bg-elevated text-muted"
          }`}
        >
          {t("filterAll")}
        </Link>
        <Link
          href="/patterns?access=free"
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            access === "free" ? "bg-apricot text-bone" : "bg-elevated text-muted"
          }`}
        >
          {t("free")}
        </Link>
        <Link
          href="/patterns?access=paid"
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            access === "paid" ? "bg-apricot text-bone" : "bg-elevated text-muted"
          }`}
        >
          {t("paid")}
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/patterns?category=${c.slug}`}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              categorySlug === c.slug
                ? "bg-celadon text-bone"
                : "bg-elevated text-muted"
            }`}
          >
            {pickLocalized(c.name, locale)}
          </Link>
        ))}
      </div>

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
