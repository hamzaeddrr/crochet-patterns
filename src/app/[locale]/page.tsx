import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PatternCard } from "@/components/site/PatternCard";
import { HomeHero } from "@/components/site/HomeHero";
import { StitchMarquee } from "@/components/site/StitchMarquee";
import { Reveal } from "@/components/site/Reveal";
import { getPublishedPatterns, readSiteContent } from "@/lib/data/store";
import { pickLocalized } from "@/types";
import type { Locale } from "@/i18n/routing";
import type { Metadata } from "next";
import { pageSeoMetadata } from "@/lib/seo/page-meta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return pageSeoMetadata("home", locale, "", {
    title: "Loopcraft",
    description: t("subtitle"),
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const patterns = await getPublishedPatterns();
  const featured = patterns.filter((p) => p.featured).slice(0, 6);
  const show = featured.length ? featured : patterns.slice(0, 6);
  const { categories, pages } = await readSiteContent();
  const home = pages.home;
  const title = home?.heroTitle
    ? pickLocalized(home.heroTitle, locale) || t("title")
    : t("title");
  const subtitle = home?.heroSubtitle
    ? pickLocalized(home.heroSubtitle, locale) || t("subtitle")
    : t("subtitle");

  return (
    <>
      <HomeHero
        title={title}
        subtitle={subtitle}
        cta={t("cta")}
        ctaSecondary={t("ctaSecondary")}
      />

      <StitchMarquee />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                Handmade picks
              </p>
              <h2 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
                {t("featured")}
              </h2>
            </div>
            <Link href="/patterns" className="btn-ghost">
              {t("cta")} →
            </Link>
          </div>
        </Reveal>

        {show.length === 0 ? (
          <Reveal delay={80}>
            <div className="soft-card mt-10 p-10 text-center text-muted">
              Publish your first pattern from the admin studio and it will appear
              here.
            </div>
          </Reveal>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {show.map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <PatternCard pattern={p} locale={locale} index={i} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="bg-elevated py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-apricot">
              Browse by mood
            </p>
            <h2 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
              {t("categoriesTitle")}
            </h2>
            <p className="mt-3 max-w-md text-muted">{t("categoriesSubtitle")}</p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={i * 60}>
                <Link
                  href={`/categories/${c.slug}`}
                  className="soft-card block p-5 transition hover:-translate-y-0.5"
                >
                  <span className="text-2xl">{c.icon}</span>
                  <h3 className="mt-3 font-display text-2xl text-ink">
                    {pickLocalized(c.name, locale)}
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    {pickLocalized(c.description, locale)}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <h2 className="font-display text-4xl text-ink sm:text-5xl">
            {t("whyTitle")}
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {(
            [
              ["why1Title", "why1Body"],
              ["why2Title", "why2Body"],
              ["why3Title", "why3Body"],
            ] as const
          ).map(([titleKey, bodyKey], i) => (
            <Reveal key={titleKey} delay={i * 80}>
              <div className="soft-card p-6">
                <h3 className="font-display text-2xl text-ink">{t(titleKey)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {t(bodyKey)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
