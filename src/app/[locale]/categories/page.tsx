import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/site/Reveal";
import { getPublishedPatterns, readSiteContent } from "@/lib/data/store";
import { pickLocalized } from "@/types";
import type { Locale } from "@/i18n/routing";
import { siteUrl } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "categories" });
  const prefix = locale === "en" ? "" : `/${locale}`;
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `${siteUrl()}${prefix}/categories`,
      languages: {
        en: `${siteUrl()}/categories`,
        fr: `${siteUrl()}/fr/categories`,
        es: `${siteUrl()}/es/categories`,
      },
    },
  };
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("categories");
  const { categories } = await readSiteContent();
  const patterns = await getPublishedPatterns();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-32 sm:px-6">
      <Reveal>
        <h1 className="font-display text-5xl text-ink sm:text-6xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-muted">{t("subtitle")}</p>
      </Reveal>
      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {categories.map((c, i) => {
          const count = patterns.filter((p) =>
            p.categoryIds.includes(c.id)
          ).length;
          return (
            <Reveal key={c.id} delay={i * 80}>
              <Link
                href={`/categories/${c.slug}`}
                className="group soft-card flex min-h-[170px] flex-col justify-between p-8 transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(43,37,34,0.08)]"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-3 font-display text-3xl text-ink group-hover:text-apricot">
                    {pickLocalized(c.name, locale)}
                  </h2>
                  <p className="mt-2 max-w-sm text-sm text-muted">
                    {pickLocalized(c.description, locale)}
                  </p>
                </div>
                <p className="mt-6 text-sm font-bold text-celadon">
                  {t("count", { count })} →
                </p>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
