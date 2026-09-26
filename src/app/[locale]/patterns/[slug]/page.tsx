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
import {
  PatternColorLegend,
  PatternMakePath,
  PatternPartsDiagram,
} from "@/components/site/PatternVisualGuide";
import { CrochetStitchDiagram } from "@/components/site/CrochetStitchDiagram";
import {
  cleanComponentDisplayName,
  isCrochetedComponent,
} from "@/lib/crochet/construction";
import { deriveTechniques } from "@/lib/crochet/techniques";
import { getPublishedTechniques } from "@/lib/data/techniques-store";
import { siteUrl, versionedAssetUrl } from "@/lib/utils";
import { isPatternUnlocked, UNLOCK_COOKIE } from "@/lib/billing/unlock";
import { Reveal } from "@/components/site/Reveal";
import { SavePatternButton } from "@/components/site/SavePatternButton";
import { TrackRecentView } from "@/components/site/TrackRecentView";
import { PatternStudioWorkspace } from "@/components/site/PatternStudioWorkspace";

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
  const techniqueLibrary = await getPublishedTechniques();
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
  const techniques = deriveTechniques(pattern.designSpec, pattern.content);

  return (
    <div className="mx-auto max-w-6xl px-3 pb-28 pt-24 sm:px-6 sm:pt-32">
      <TrackRecentView patternId={pattern.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-8">
        <div className="relative aspect-[5/4] overflow-hidden rounded-[1.35rem] bg-elevated shadow-[0_16px_40px_rgba(43,37,34,0.08)] sm:aspect-[5/4] sm:rounded-[2rem]">
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
              className="object-contain p-3 sm:p-4"
              priority
              sizes="(max-width:1024px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#d96b52aa,transparent_50%),radial-gradient(circle_at_80%_70%,#8fa58baa,transparent_45%)]" />
          )}
        </div>
        <div className="min-w-0 lg:sticky lg:top-28">
          <p className="inline-flex max-w-full flex-wrap rounded-full bg-elevated px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-celadon sm:text-xs sm:tracking-[0.16em]">
            {tc(pattern.designSpec.difficulty)}
            {pattern.free
              ? ` · ${t("free")}`
              : ` · ${formatPrice(pattern.priceCents, pattern.currency)}`}
          </p>
          <h1 className="mt-3 break-words font-display text-3xl leading-tight text-ink sm:mt-4 sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted sm:mt-4 sm:text-lg">
            {summary}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-2 text-sm sm:mt-8 sm:gap-3">
            <div className="soft-card p-3 sm:p-4">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-muted sm:text-xs">
                {t("infoSize")}
              </dt>
              <dd className="mt-1 font-display text-xl sm:text-2xl">
                {pattern.designSpec.size_cm
                  ? `${pattern.designSpec.size_cm} cm`
                  : "—"}
              </dd>
            </div>
            <div className="soft-card p-3 sm:p-4">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-muted sm:text-xs">
                {t("infoHook")}
              </dt>
              <dd className="mt-1 break-words font-display text-xl sm:text-2xl">
                {pattern.content.materials.hook ||
                  pattern.designSpec.hook_mm ||
                  "—"}
              </dd>
            </div>
            <div className="soft-card p-3 sm:p-4">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-muted sm:text-xs">
                {t("infoYarn")}
              </dt>
              <dd className="mt-1 font-display text-lg capitalize sm:text-xl">
                {pattern.designSpec.yarn_weight || "—"}
              </dd>
            </div>
            <div className="soft-card p-3 sm:p-4">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-muted sm:text-xs">
                {t("infoConstruction")}
              </dt>
              <dd className="mt-1 break-words font-display text-lg capitalize sm:text-xl">
                {pattern.designSpec.construction?.replace(/-/g, " ") || "—"}
              </dd>
            </div>
            {pattern.designSpec.estimated_time ? (
              <div className="soft-card p-3 sm:p-4">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-muted sm:text-xs">
                  {t("infoTime")}
                </dt>
                <dd className="mt-1 font-display text-lg sm:text-xl">
                  {pattern.designSpec.estimated_time}
                </dd>
              </div>
            ) : null}
            {pattern.content.materials.gauge ? (
              <div className="soft-card col-span-2 p-3 sm:col-span-1 sm:p-4">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-muted sm:text-xs">
                  {t("infoGauge")}
                </dt>
                <dd className="mt-1 text-sm font-semibold leading-snug text-ink">
                  {pattern.content.materials.gauge}
                </dd>
              </div>
            ) : null}
          </dl>

          {techniques.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted sm:text-xs">
                {t("infoTechniques")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {techniques.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full bg-elevated px-2.5 py-1 text-[11px] font-bold text-ink sm:px-3 sm:text-xs"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            {unlocked && pattern.pdfPath && (
              <a href={pdfHref} className="btn-primary w-full justify-center sm:w-auto">
                {t("download")} →
              </a>
            )}
            {!unlocked && (
              <BuyPatternButton
                slug={pattern.slug}
                locale={locale}
                priceCents={pattern.priceCents}
                currency={pattern.currency}
                label={t("buy")}
                className="w-full sm:w-auto [&_button]:w-full sm:[&_button]:w-auto"
              />
            )}
            <SavePatternButton
              patternId={pattern.id}
              saveLabel={t("savePattern")}
              savedLabel={t("savedPattern")}
              className="w-full justify-center sm:w-auto"
            />
          </div>

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

      <Reveal className="mt-8 sm:mt-12">
        <PatternMakePath
          components={pattern.content.components}
          hasAssembly={pattern.content.assembly.length > 0}
          hasFinishing={pattern.content.finishing.length > 0}
          title={t("makePathTitle")}
          subtitle={t("makePathSubtitle")}
          jumpLabel={t("makePathEyebrow")}
          assembleLabel={t("assembly")}
          finishLabel={t("finishing")}
          crochetedLabel={t("makePathCrocheted")}
          detailsLabel={t("makePathDetails")}
          interactive={unlocked}
        />
      </Reveal>

      <div className="mt-6 grid gap-5 lg:mt-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6">
        <Reveal delay={60}>
          <PatternPartsDiagram
            components={pattern.content.components}
            objectLabel={pattern.designSpec.object.replace(/_/g, " ")}
            title={t("partsTitle")}
            subtitle={t("partsSubtitle")}
            finishedLabel={t("finishedPiece")}
            interactive={unlocked}
          />
        </Reveal>
        <Reveal delay={120} className="space-y-4">
          <PatternColorLegend
            colors={pattern.designSpec.colors || []}
            title={t("colorPalette")}
            note={t("colorPaletteNote")}
          />
          {pattern.imagePath ? (
            <div className="overflow-hidden rounded-[1.25rem] border border-line bg-[#fffdf9] sm:rounded-[1.35rem]">
              <div className="border-b border-line px-4 py-3 sm:px-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
                  {t("stepGuide")}
                </p>
                <p className="mt-1 text-sm text-muted">{t("stepGuideHint")}</p>
              </div>
              <div className="relative aspect-[5/4] bg-elevated/50">
                <Image
                  src={
                    versionedAssetUrl(pattern.imagePath, pattern.updatedAt) ||
                    pattern.imagePath
                  }
                  alt={title}
                  fill
                  unoptimized
                  className="object-contain p-3"
                  sizes="(max-width:1024px) 100vw, 40vw"
                />
              </div>
              {unlocked ? (
                <div className="flex flex-wrap gap-2 border-t border-line px-3 py-3 sm:px-4">
                  {pattern.content.components
                    .filter(isCrochetedComponent)
                    .slice(0, 6)
                    .map((c, i) => {
                      const { title } = cleanComponentDisplayName(
                        c.name,
                        c.make
                      );
                      return (
                        <a
                          key={c.id}
                          href={`#part-${c.id}`}
                          className="rounded-full bg-elevated px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-apricot hover:text-bone"
                        >
                          {i + 1}. {title}
                        </a>
                      );
                    })}
                </div>
              ) : null}
            </div>
          ) : null}
        </Reveal>
      </div>

      <div className="mt-10 grid gap-5 sm:mt-16 sm:gap-8 lg:grid-cols-2">
        <section className="soft-card p-4 sm:p-6">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">
            {t("materials")}
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-muted sm:mt-5">
            {(unlocked
              ? pattern.content.materials.yarn
              : pattern.content.materials.yarn.slice(0, 2)
            ).map((y) => (
              <li key={y} className="break-words border-b border-line pb-2">
                {y}
              </li>
            ))}
            {!unlocked && pattern.content.materials.yarn.length > 2 && (
              <li className="text-muted">{t("lockedTeaser")}</li>
            )}
            <li className="break-words border-b border-line pb-2">
              Hook: {pattern.content.materials.hook}
            </li>
            {unlocked &&
              pattern.content.materials.notions.map((n) => (
                <li key={n} className="break-words border-b border-line pb-2">
                  {n}
                </li>
              ))}
          </ul>
        </section>
        <section className="soft-card p-4 sm:p-6">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">
            {t("abbreviations")}
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm sm:mt-5 sm:gap-3">
            {(unlocked
              ? pattern.content.abbreviations
              : pattern.content.abbreviations.slice(0, 4)
            ).map((a) => (
              <li
                key={a.abbr}
                className="break-words rounded-2xl bg-bg px-3 py-2.5"
              >
                <span className="font-bold text-apricot">{a.abbr}</span>
                <span className="text-muted"> — {a.meaning}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {unlocked ? (
        <>
          <PatternStudioWorkspace
            patternId={pattern.id}
            components={pattern.content.components}
            techniqueLibrary={techniqueLibrary}
            labels={{
              instructions: t("instructions"),
              jumpToRound: t("jumpToRound"),
              progressTemplate: String(t.raw("progressSummary")),
              markComplete: t("markComplete"),
              markedComplete: t("markedComplete"),
              next: t("studioNext"),
              previous: t("studioPrevious"),
              focusHint: t("studioFocusHint"),
              roundOf: t("studioRoundOf"),
              accessories: t("studioAccessories"),
              stitchChart: t("stitchChart"),
              stitchChartRows: t("stitchChartRows"),
              stitchDiagramTitle: t("stitchDiagramTitle"),
              stitchDiagramSubtitle: t("stitchDiagramSubtitle"),
              stitchDiagramFlatSubtitle: t("stitchDiagramFlatSubtitle"),
              stitchDiagramRound: t("stitchDiagramRound"),
              stitchDiagramRow: t("stitchDiagramRow"),
              stitchDiagramWritten: t("stitchDiagramWritten"),
              stitchDiagramLegend: t("stitchDiagramLegend"),
              stitchDiagramEnlarge: t("stitchDiagramEnlarge"),
              stitchDiagramClose: t("stitchDiagramClose"),
              modeDashboard: t("studioModeDashboard"),
              modeFocus: t("studioModeFocus"),
              modeList: t("studioModeList"),
              modeHint: t("studioModeHint"),
              panelSteps: t("studioPanelSteps"),
              panelGraph: t("studioPanelGraph"),
              panelChart: t("studioPanelChart"),
              roundsNav: t("studioRoundsNav"),
            }}
          />

          {pattern.content.assembly.length > 0 && (
            <section
              id="assembly"
              className="soft-card mt-8 scroll-mt-28 p-4 sm:mt-12 sm:p-6"
            >
              <h2 className="font-display text-2xl text-ink sm:text-3xl">
                {t("assembly")}
              </h2>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-muted sm:mt-5">
                {pattern.content.assembly.map((s) => (
                  <li key={s} className="break-words">
                    {s}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {pattern.content.finishing.length > 0 && (
            <section
              id="finishing"
              className="soft-card mt-8 scroll-mt-28 p-4 sm:mt-12 sm:p-6"
            >
              <h2 className="font-display text-2xl text-ink sm:text-3xl">
                {t("finishing")}
              </h2>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-muted sm:mt-5">
                {pattern.content.finishing.map((s) => (
                  <li key={s} className="break-words">
                    {s}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      ) : (
        <section className="mt-10 space-y-5 sm:mt-16 sm:space-y-6">
          {pattern.content.components[0] ? (
            <div className="overflow-hidden rounded-[1.25rem] border border-line bg-bg sm:rounded-[1.5rem]">
              <div className="bg-apricot px-4 py-3 font-display text-lg text-bone sm:px-5 sm:py-4 sm:text-xl">
                {pattern.content.components[0].name} · {t("stitchDiagramTitle")}
              </div>
              <CrochetStitchDiagram
                component={pattern.content.components[0]}
                title={t("stitchDiagramTitle")}
                subtitle={t("stitchDiagramSubtitle")}
                flatSubtitle={t("stitchDiagramFlatSubtitle")}
                roundLabel={t("stitchDiagramRound")}
                rowLabel={t("stitchDiagramRow")}
                writtenOrderLabel={t("stitchDiagramWritten")}
                legendLabel={t("stitchDiagramLegend")}
                previewOnly
              />
            </div>
          ) : null}
          <div className="soft-card p-5 text-center sm:p-8">
            <h2 className="font-display text-2xl text-ink sm:text-3xl">
              {t("lockedTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted sm:text-base">
              {t("lockedBody")}
            </p>
            <div className="mt-6 flex justify-center">
              <BuyPatternButton
                slug={pattern.slug}
                locale={locale}
                priceCents={pattern.priceCents}
                currency={pattern.currency}
                label={t("buy")}
                className="w-full max-w-xs sm:w-auto"
              />
            </div>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-12 sm:mt-16">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">
            {t("related")}
          </h2>
          <div className="mt-6 grid gap-5 sm:mt-8 sm:grid-cols-3 sm:gap-6">
            {related.map((p, i) => (
              <PatternCard key={p.id} pattern={p} locale={locale} index={i} />
            ))}
          </div>
        </section>
      )}

      {!unlocked && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:px-6 sm:py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-display text-base text-ink sm:text-lg">
                {title}
              </p>
              <p className="text-xs text-muted sm:text-sm">
                {formatPrice(pattern.priceCents, pattern.currency)}
              </p>
            </div>
            <BuyPatternButton
              slug={pattern.slug}
              locale={locale}
              priceCents={pattern.priceCents}
              currency={pattern.currency}
              label={t("buy")}
              className="shrink-0 [&_button]:px-3 [&_button]:py-2.5 [&_button]:text-sm sm:[&_button]:px-[1.6rem] sm:[&_button]:py-[0.85rem]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
