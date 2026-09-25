import type { Metadata } from "next";
import Image from "next/image";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  getPatternBySlug,
  getPublishedPatterns,
  readSiteContent,
} from "@/lib/data/store";
import { formatPrice, pickLocalized } from "@/types";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { PatternCard } from "@/components/site/PatternCard";
import { BuyPatternButton } from "@/components/site/BuyPatternButton";
import { siteUrl, versionedAssetUrl } from "@/lib/utils";
import { isPatternUnlocked, UNLOCK_COOKIE } from "@/lib/billing/unlock";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const pattern = await getPatternBySlug(slug);
  if (!pattern || pattern.status !== "published") {
    return { title: "Pattern" };
  }
  const title = pickLocalized(pattern.content.seoTitle, locale as Locale);
  const description = pickLocalized(
    pattern.content.seoDescription,
    locale as Locale
  );
  const prefix = locale === "en" ? "" : `/${locale}`;
  const url = `${siteUrl()}${prefix}/patterns/${slug}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${siteUrl()}/patterns/${slug}`,
        fr: `${siteUrl()}/fr/patterns/${slug}`,
        es: `${siteUrl()}/es/patterns/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: pattern.imagePath
        ? [
            {
              url: versionedAssetUrl(
                siteUrl(pattern.imagePath),
                pattern.updatedAt
              )!,
            },
          ]
        : undefined,
    },
  };
}

export default async function PatternDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const pattern = await getPatternBySlug(slug);
  if (!pattern || pattern.status !== "published") notFound();

  const jar = await cookies();
  const unlocked =
    pattern.free ||
    isPatternUnlocked(jar.get(UNLOCK_COOKIE)?.value, pattern.id);

  const t = await getTranslations("patterns");
  const tc = await getTranslations("common");
  const { categories } = await readSiteContent();
  const title = pickLocalized(pattern.content.title, locale);
  const summary = pickLocalized(pattern.content.summary, locale);
  const related = (await getPublishedPatterns())
    .filter((p) => p.id !== pattern.id)
    .slice(0, 3);

  const jsonLd = pattern.free
    ? {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: title,
        description: summary,
        image: pattern.imagePath ? siteUrl(pattern.imagePath) : undefined,
        inLanguage: locale,
        isAccessibleForFree: true,
        genre: "Crochet pattern",
      }
    : {
        "@context": "https://schema.org",
        "@type": "Product",
        name: title,
        description: summary,
        image: pattern.imagePath ? siteUrl(pattern.imagePath) : undefined,
        offers: {
          "@type": "Offer",
          priceCurrency: (pattern.currency || "usd").toUpperCase(),
          price: (pattern.priceCents / 100).toFixed(2),
          availability: "https://schema.org/InStock",
        },
      };

  const pdfHref = `/api/patterns/${pattern.slug}/pdf`;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-32 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-elevated shadow-[0_16px_40px_rgba(43,37,34,0.08)] sm:aspect-[5/4]">
          {pattern.imagePath ? (
            <Image
              key={`${pattern.imagePath}-${pattern.updatedAt}`}
              src={
                versionedAssetUrl(pattern.imagePath, pattern.updatedAt) ||
                pattern.imagePath
              }
              alt={title}
              fill
              unoptimized
              className="object-contain p-4"
              priority
              sizes="(max-width:1024px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#d96b52aa,transparent_50%),radial-gradient(circle_at_80%_70%,#8fa58baa,transparent_45%)]" />
          )}
        </div>
        <div className="lg:sticky lg:top-28">
          <p className="inline-flex rounded-full bg-elevated px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-celadon">
            {tc(pattern.designSpec.difficulty)}
            {pattern.free
              ? ` · ${t("free")}`
              : ` · ${formatPrice(pattern.priceCents, pattern.currency)}`}
          </p>
          <h1 className="mt-4 font-display text-4xl text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">{summary}</p>
          <dl className="mt-8 grid grid-cols-2 gap-3 text-sm">
            <div className="soft-card p-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                Size
              </dt>
              <dd className="mt-1 font-display text-2xl">
                {pattern.designSpec.size_cm
                  ? `${pattern.designSpec.size_cm} cm`
                  : "—"}
              </dd>
            </div>
            <div className="soft-card p-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                Hook
              </dt>
              <dd className="mt-1 font-display text-2xl">
                {pattern.content.materials.hook ||
                  pattern.designSpec.hook_mm ||
                  "—"}
              </dd>
            </div>
          </dl>

          {unlocked && pattern.pdfPath && (
            <a href={pdfHref} className="btn-primary mt-8">
              {t("download")} →
            </a>
          )}
          {!unlocked && (
            <BuyPatternButton
              className="mt-8"
              slug={pattern.slug}
              locale={locale}
              priceCents={pattern.priceCents}
              currency={pattern.currency}
              label={t("buy")}
            />
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {categories
              .filter((c) => pattern.categoryIds.includes(c.id))
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.slug}`}
                  className="rounded-full bg-celadon/15 px-3 py-1.5 text-xs font-bold text-celadon transition hover:bg-celadon hover:text-bone"
                >
                  {pickLocalized(c.name, locale)}
                </Link>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-2">
        <section className="soft-card p-6">
          <h2 className="font-display text-3xl text-ink">{t("materials")}</h2>
          <ul className="mt-5 space-y-3 text-sm text-muted">
            {(unlocked
              ? pattern.content.materials.yarn
              : pattern.content.materials.yarn.slice(0, 2)
            ).map((y) => (
              <li key={y} className="border-b border-line pb-2">
                {y}
              </li>
            ))}
            {!unlocked && pattern.content.materials.yarn.length > 2 && (
              <li className="text-muted">{t("lockedTeaser")}</li>
            )}
            <li className="border-b border-line pb-2">
              Hook: {pattern.content.materials.hook}
            </li>
            {unlocked &&
              pattern.content.materials.notions.map((n) => (
                <li key={n} className="border-b border-line pb-2">
                  {n}
                </li>
              ))}
          </ul>
        </section>
        <section className="soft-card p-6">
          <h2 className="font-display text-3xl text-ink">
            {t("abbreviations")}
          </h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 text-sm">
            {(unlocked
              ? pattern.content.abbreviations
              : pattern.content.abbreviations.slice(0, 4)
            ).map((a) => (
              <li key={a.abbr} className="rounded-2xl bg-bg px-3 py-2.5">
                <span className="font-bold text-apricot">{a.abbr}</span>
                <span className="text-muted"> — {a.meaning}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {unlocked ? (
        <>
          <section className="mt-16">
            <h2 className="font-display text-3xl text-ink">{t("instructions")}</h2>
            <div className="mt-6 space-y-6">
              {pattern.content.components.map((component) => (
                <div
                  key={component.id}
                  className="overflow-hidden rounded-[1.5rem] border border-line bg-bg"
                >
                  <div className="bg-apricot px-5 py-4 font-display text-xl text-bone">
                    {component.name}
                    {component.make && component.make > 1
                      ? ` · make ${component.make}`
                      : ""}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-elevated text-muted">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Rnd</th>
                          <th className="px-5 py-3 font-semibold">
                            Instructions
                          </th>
                          <th className="px-5 py-3 font-semibold">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {component.rounds.map((r) => (
                          <tr key={r.round} className="border-t border-line">
                            <td className="px-5 py-3 font-display text-lg text-gold">
                              {r.round}
                            </td>
                            <td className="px-5 py-3">{r.instructions}</td>
                            <td className="px-5 py-3 font-bold">{r.result}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {pattern.content.assembly.length > 0 && (
            <section className="soft-card mt-12 p-6">
              <h2 className="font-display text-3xl text-ink">{t("assembly")}</h2>
              <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm text-muted">
                {pattern.content.assembly.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </section>
          )}
        </>
      ) : (
        <section className="soft-card mt-16 p-8 text-center">
          <h2 className="font-display text-3xl text-ink">{t("lockedTitle")}</h2>
          <p className="mx-auto mt-3 max-w-md text-muted">{t("lockedBody")}</p>
          <div className="mt-6 flex justify-center">
            <BuyPatternButton
              slug={pattern.slug}
              locale={locale}
              priceCents={pattern.priceCents}
              currency={pattern.currency}
              label={t("buy")}
            />
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-3xl text-ink">{t("related")}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {related.map((p, i) => (
              <PatternCard key={p.id} pattern={p} locale={locale} index={i} />
            ))}
          </div>
        </section>
      )}

      {!unlocked && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-display text-lg text-ink">{title}</p>
              <p className="text-sm text-muted">
                {formatPrice(pattern.priceCents, pattern.currency)}
              </p>
            </div>
            <BuyPatternButton
              slug={pattern.slug}
              locale={locale}
              priceCents={pattern.priceCents}
              currency={pattern.currency}
              label={t("buy")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
