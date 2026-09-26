import {
  ChartSymbolGlyph,
  chartKindForTechniqueKey,
} from "@/components/site/ChartSymbolGlyph";
import { SYMBOL_LABELS } from "@/lib/crochet/stitch-symbols";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { pickLocalized, type LocalizedString } from "@/types";
import { cn } from "@/lib/utils";

export function TechniqueChartKey({
  techniqueKey,
  chartSymbolPath,
  chartSymbolNote,
  locale,
  labels,
  className,
}: {
  techniqueKey: string;
  chartSymbolPath?: string;
  chartSymbolNote?: LocalizedString;
  locale: Locale;
  labels: {
    eyebrow: string;
    defaultNote: string;
    guideLink: string;
  };
  className?: string;
}) {
  const kind = chartKindForTechniqueKey(techniqueKey);
  const note = chartSymbolNote
    ? pickLocalized(chartSymbolNote, locale).trim()
    : "";
  const hasCustom = Boolean(chartSymbolPath);
  if (!hasCustom && !kind) return null;

  const abbr = kind ? SYMBOL_LABELS[kind] : null;

  return (
    <aside
      className={cn(
        "flex flex-wrap items-center gap-4 border-y border-line py-5",
        className
      )}
    >
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-line bg-[linear-gradient(165deg,#fffdf9,#f3ebe0)]">
        {hasCustom ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={chartSymbolPath}
            alt=""
            className="h-12 w-12 object-contain"
          />
        ) : kind ? (
          <ChartSymbolGlyph kind={kind} size={36} />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
          {labels.eyebrow}
          {abbr ? ` · ${abbr}` : ""}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink sm:text-base">
          {note || labels.defaultNote}
        </p>
        <Link
          href="/learn/charts"
          className="mt-2 inline-block text-sm font-semibold text-apricot transition hover:text-ink"
        >
          {labels.guideLink}
        </Link>
      </div>
    </aside>
  );
}
