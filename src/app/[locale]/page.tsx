import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PatternCard } from "@/components/site/PatternCard";
import { HomeHero } from "@/components/site/HomeHero";
import { StitchMarquee } from "@/components/site/StitchMarquee";
import { Reveal } from "@/components/site/Reveal";
import { getPublishedPatterns, readSiteContent } from "@/lib/data/store";
import { pickLocalized } from "@/types";
import type { Locale } from "@/i18n/routing";

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
  const { categories } = await readSiteContent();

  return (
    <>
      <HomeHero
        title={t("title")}
        subtitle={t("subtitle")}
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
              <Reveal key={c.id} delay={i * 70}>
                <Link
                  href={`/categories/${c.slug}`}
                  className="group block rounded-[1.5rem] border border-ink/5 bg-bg p-6 transition hover:-translate-y-1 hover:border-celadon hover:shadow-[0_14px_30px_rgba(43,37,34,0.08)]"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-celadon/20 font-display text-lg text-celadon">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 font-display text-2xl text-ink group-hover:text-apricot">
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

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <h2 className="max-w-2xl font-display text-4xl leading-tight text-ink sm:text-5xl">
            {t("whyTitle")}
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { n: "01", title: t("why1Title"), body: t("why1Body"), tone: "bg-apricot/10" },
            { n: "02", title: t("why2Title"), body: t("why2Body"), tone: "bg-celadon/15" },
            { n: "03", title: t("why3Title"), body: t("why3Body"), tone: "bg-gold/15" },
          ].map((item, i) => (
            <Reveal key={item.n} delay={i * 90}>
              <div className={`rounded-[1.75rem] ${item.tone} p-7`}>
                <p className="font-display text-sm text-muted">{item.n}</p>
                <h3 className="mt-3 font-display text-2xl text-ink">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
