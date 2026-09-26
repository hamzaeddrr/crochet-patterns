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
  StitchCountChart,
} from "@/components/site/PatternVisualGuide";
import { CrochetStitchDiagram } from "@/components/site/CrochetStitchDiagram";
import {
  cleanComponentDisplayName,
  detectConstructionMode,
  isCrochetedComponent,
  isFastenOffRound,
  isRedundantNoteComponent,
  partitionComponentRounds,
  stepLabelForMode,
} from "@/lib/crochet/construction";
import { deriveTechniques } from "@/lib/crochet/techniques";
import { siteUrl, versionedAssetUrl } from "@/lib/utils";
import { isPatternUnlocked, UNLOCK_COOKIE } from "@/lib/billing/unlock";
import { Reveal } from "@/components/site/Reveal";
import { SavePatternButton } from "@/components/site/SavePatternButton";
import { TrackRecentView } from "@/components/site/TrackRecentView";
import {
  RoundDoneButton,
  RoundJumpBar,
} from "@/components/site/RoundJumpBar";
import { buildJumpChips, roundAnchor } from "@/lib/crochet/jump-chips";
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
  const techniques = deriveTechniques(pattern.designSpec, pattern.content);

  const jumpChips = unlocked
    ? buildJumpChips(
        pattern.content.components
          .filter((c) => !isRedundantNoteComponent(c))
          .map((c) => {
            const mode = detectConstructionMode(c);
            if (mode === "note") {
              return { componentId: c.id, rounds: [], stepLabel: "Step" };
            }
            const stepLabel = stepLabelForMode(mode);
            const { main } = partitionComponentRounds(c.rounds || []);
            return {
              componentId: c.id,
              stepLabel,
              rounds: main.map((r) => ({
                round: r.round,
                fo: isFastenOffRound(r),
              })),
            };
          })
      )
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-32 sm:px-6">
      <TrackRecentView patternId={pattern.id} />
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
                {t("infoSize")}
              </dt>
              <dd className="mt-1 font-display text-2xl">
                {pattern.designSpec.size_cm
                  ? `${pattern.designSpec.size_cm} cm`
                  : "—"}
              </dd>
            </div>
            <div className="soft-card p-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                {t("infoHook")}
              </dt>
              <dd className="mt-1 font-display text-2xl">
                {pattern.content.materials.hook ||
                  pattern.designSpec.hook_mm ||
                  "—"}
              </dd>
            </div>
            <div className="soft-card p-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                {t("infoYarn")}
              </dt>
              <dd className="mt-1 font-display text-xl capitalize">
                {pattern.designSpec.yarn_weight || "—"}
              </dd>
            </div>
            <div className="soft-card p-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                {t("infoConstruction")}
              </dt>
              <dd className="mt-1 font-display text-xl capitalize">
                {pattern.designSpec.construction?.replace(/-/g, " ") || "—"}
              </dd>
            </div>
            {pattern.designSpec.estimated_time ? (
              <div className="soft-card p-4">
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                  {t("infoTime")}
                </dt>
                <dd className="mt-1 font-display text-xl">
                  {pattern.designSpec.estimated_time}
                </dd>
              </div>
            ) : null}
            {pattern.content.materials.gauge ? (
              <div className="soft-card p-4">
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                  {t("infoGauge")}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-ink">
                  {pattern.content.materials.gauge}
                </dd>
              </div>
            ) : null}
          </dl>

          {techniques.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                {t("infoTechniques")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {techniques.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full bg-elevated px-3 py-1 text-xs font-bold text-ink"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {unlocked && pattern.pdfPath && (
              <a href={pdfHref} className="btn-primary">
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
              />
            )}
            <SavePatternButton
              patternId={pattern.id}
              saveLabel={t("savePattern")}
              savedLabel={t("savedPattern")}
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

      <Reveal className="mt-12">
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

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
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
          />
          {pattern.imagePath ? (
            <div className="overflow-hidden rounded-[1.35rem] border border-line bg-[#fffdf9]">
              <div className="border-b border-line px-5 py-3">
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
                <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
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
          <section className="mt-16" id="instructions">
            <h2 className="font-display text-3xl text-ink">{t("instructions")}</h2>
            <div className="mt-6">
              <RoundJumpBar
                chips={jumpChips}
                patternId={pattern.id}
                title={t("jumpToRound")}
                progressTemplate={String(t.raw("progressSummary"))}
              />
            </div>
            <div className="mt-2 space-y-6">
              {pattern.content.components.map((component) => {
                if (isRedundantNoteComponent(component)) return null;

                const mode = detectConstructionMode(component);
                const stepLabel = stepLabelForMode(mode);
                const { title, makeSuffix } = cleanComponentDisplayName(
                  component.name,
                  component.make
                );
                const showCharts = mode !== "note";
                const { main, accessories } = partitionComponentRounds(
                  component.rounds || []
                );
                return (
                <div
                  key={component.id}
                  id={`part-${component.id}`}
                  className="scroll-mt-36 overflow-hidden rounded-[1.5rem] border border-line bg-bg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-apricot px-5 py-4">
                    <h3 className="font-display text-xl text-bone">
                      {title}
                      {makeSuffix}
                    </h3>
                    {showCharts ? (
                      <a
                        href="#instructions"
                        className="text-xs font-bold uppercase tracking-wider text-bone/80 hover:text-bone"
                      >
                        {t("jumpToRounds")}
                      </a>
                    ) : null}
                  </div>
                  {showCharts ? (
                    <>
                      <StitchCountChart
                        component={component}
                        title={
                          mode === "row"
                            ? t("stitchChartRows")
                            : t("stitchChart")
                        }
                      />
                      <CrochetStitchDiagram
                        component={component}
                        title={t("stitchDiagramTitle")}
                        subtitle={t("stitchDiagramSubtitle")}
                        flatSubtitle={t("stitchDiagramFlatSubtitle")}
                        roundLabel={t("stitchDiagramRound")}
                        rowLabel={t("stitchDiagramRow")}
                        writtenOrderLabel={t("stitchDiagramWritten")}
                        legendLabel={t("stitchDiagramLegend")}
                      />
                    </>
                  ) : null}
                  {mode === "note" ? (
                    <div className="space-y-3 px-5 py-4 text-sm text-ink">
                      {(component.rounds || []).map((r) => (
                        <p key={r.round}>{r.instructions}</p>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-elevated text-muted">
                            <tr>
                              <th className="px-5 py-3 font-semibold">
                                {stepLabel}
                              </th>
                              <th className="px-5 py-3 font-semibold">
                                Instructions
                              </th>
                              <th className="px-5 py-3 font-semibold">Count</th>
                              <th className="px-5 py-3 font-semibold">
                                {t("progressCol")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {main.map((r, idx) => {
                              const fo = isFastenOffRound(r);
                              const anchor = roundAnchor(
                                component.id,
                                r.round,
                                fo
                              );
                              return (
                                <tr
                                  key={`main-${r.round}-${idx}`}
                                  id={anchor}
                                  className="scroll-mt-40 border-t border-line"
                                >
                                  <td className="px-5 py-3 font-display text-lg text-gold">
                                    {fo ? "FO" : r.round}
                                  </td>
                                  <td className="px-5 py-3">
                                    {r.instructions}
                                  </td>
                                  <td className="px-5 py-3 font-bold">
                                    {!fo &&
                                    typeof r.result === "number" &&
                                    r.result > 0
                                      ? r.result
                                      : "—"}
                                  </td>
                                  <td className="px-5 py-3">
                                    {!fo ? (
                                      <RoundDoneButton
                                        patternId={pattern.id}
                                        componentId={component.id}
                                        round={r.round}
                                        markLabel={t("markComplete")}
                                        doneLabel={t("markedComplete")}
                                      />
                                    ) : null}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {accessories
                        .filter(
                          (acc) =>
                            !acc.steps.every((s) =>
                              /\bassembl\w*|sew together|closing\b/i.test(
                                s.instructions || ""
                              )
                            )
                        )
                        .map((acc) => (
                        <div
                          key={acc.title}
                          className="border-t border-line px-5 py-4"
                        >
                          <h4 className="font-display text-lg text-ink">
                            {acc.title}
                          </h4>
                          <ul className="mt-2 space-y-2 text-sm text-muted">
                            {acc.steps.map((s, i) => (
                              <li key={`${acc.title}-${i}`}>
                                {s.instructions}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                );
              })}
            </div>
          </section>

          {pattern.content.assembly.length > 0 && (
            <section
              id="assembly"
              className="soft-card mt-12 scroll-mt-28 p-6"
            >
              <h2 className="font-display text-3xl text-ink">{t("assembly")}</h2>
              <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm text-muted">
                {pattern.content.assembly.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </section>
          )}

          {pattern.content.finishing.length > 0 && (
            <section
              id="finishing"
              className="soft-card mt-12 scroll-mt-28 p-6"
            >
              <h2 className="font-display text-3xl text-ink">{t("finishing")}</h2>
              <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm text-muted">
                {pattern.content.finishing.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </section>
          )}
        </>
      ) : (
        <section className="mt-16 space-y-6">
          {pattern.content.components[0] ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-line bg-bg">
              <div className="bg-apricot px-5 py-4 font-display text-xl text-bone">
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
          <div className="soft-card p-8 text-center">
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
