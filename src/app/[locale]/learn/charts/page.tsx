import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  ChartSymbolGlyph,
  chartKindForTechniqueKey,
} from "@/components/site/ChartSymbolGlyph";
import { SYMBOL_LABELS } from "@/lib/crochet/stitch-symbols";
import type { ChartSymbolKind } from "@/lib/crochet/stitch-symbols";
import { getPublishedTechniques } from "@/lib/data/techniques-store";
import { pickLocalized } from "@/types";
import { ArrowLeft, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

const LEGEND: { kind: ChartSymbolKind; tipKey: string }[] = [
  { kind: "ch", tipKey: "legendCh" },
  { kind: "slst", tipKey: "legendSlst" },
  { kind: "sc", tipKey: "legendSc" },
  { kind: "hdc", tipKey: "legendHdc" },
  { kind: "dc", tipKey: "legendDc" },
  { kind: "inc", tipKey: "legendInc" },
  { kind: "dec", tipKey: "legendDec" },
  { kind: "mr", tipKey: "legendMr" },
];

export default async function LearnChartsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: loc } = await params;
  const locale = loc as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("learnCharts");
  const techniques = await getPublishedTechniques();

  const withSymbols = techniques.filter(
    (tech) =>
      tech.chartSymbolPath || chartKindForTechniqueKey(String(tech.key))
  );

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>

      <header className="mt-6 max-w-2xl">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
          <BookOpen className="h-3.5 w-3.5" strokeWidth={2.25} />
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
          {t("subtitle")}
        </p>
      </header>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-2xl text-ink">{t("howTitle")}</h2>
        <ol className="space-y-3 text-sm leading-relaxed text-muted sm:text-base">
          <li>
            <span className="font-semibold text-ink">{t("tip1Label")}</span>{" "}
            {t("tip1")}
          </li>
          <li>
            <span className="font-semibold text-ink">{t("tip2Label")}</span>{" "}
            {t("tip2")}
          </li>
          <li>
            <span className="font-semibold text-ink">{t("tip3Label")}</span>{" "}
            {t("tip3")}
          </li>
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-ink">{t("legendTitle")}</h2>
        <p className="mt-2 text-sm text-muted">{t("legendSubtitle")}</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {LEGEND.map(({ kind, tipKey }) => (
            <li
              key={kind}
              className="flex items-start gap-3 border-b border-line/70 pb-3"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-[linear-gradient(165deg,#fffdf9,#f3ebe0)]">
                <ChartSymbolGlyph kind={kind} size={28} />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="font-display text-lg text-ink">
                  {SYMBOL_LABELS[kind]}
                </p>
                <p className="mt-0.5 text-sm text-muted">{t(tipKey)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {withSymbols.length > 0 ? (
        <section className="mt-14 border-t border-line pt-10">
          <h2 className="font-display text-2xl text-ink">
            {t("practiceTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted">{t("practiceSubtitle")}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {withSymbols.map((tech) => {
              const kind = chartKindForTechniqueKey(String(tech.key));
              return (
                <li key={tech.id}>
                  <Link
                    href={`/learn/${tech.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-bg px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-apricot/50 hover:bg-apricot/10"
                  >
                    {tech.chartSymbolPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tech.chartSymbolPath}
                        alt=""
                        className="h-6 w-6 object-contain"
                      />
                    ) : kind ? (
                      <ChartSymbolGlyph kind={kind} size={20} />
                    ) : null}
                    {pickLocalized(tech.title, locale)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
