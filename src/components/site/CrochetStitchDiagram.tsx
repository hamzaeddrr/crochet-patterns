"use client";

import { useEffect, useMemo, useState } from "react";
import type { PatternComponent, PatternRound } from "@/types";
import {
  collapseSymbolRuns,
  expandOperationsToSymbols,
  SYMBOL_LABELS,
  type ChartSymbol,
  type ChartSymbolKind,
} from "@/lib/crochet/stitch-symbols";
import {
  detectConstructionMode,
  diagramRounds,
} from "@/lib/crochet/construction";

const INK = "#2b2522";
const ACCENT = "#d96b52";

function SymbolGlyph({
  kind,
  size = 18,
  color = INK,
}: {
  kind: ChartSymbolKind;
  size?: number;
  color?: string;
}) {
  const s = size;
  const common = {
    stroke: color,
    strokeWidth: 1.6,
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (kind) {
    case "ch":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <ellipse cx="12" cy="12" rx="7" ry="4.5" {...common} />
        </svg>
      );
    case "slst":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <ellipse cx="12" cy="12" rx="5" ry="3.2" fill={color} stroke="none" />
        </svg>
      );
    case "sc":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <path d="M7 7 L17 17 M17 7 L7 17" {...common} />
        </svg>
      );
    case "hdc":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <path d="M12 4 V18 M7 5 H17" {...common} />
        </svg>
      );
    case "dc":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <path d="M12 4 V18 M7 5 H17 M9 11 L15 8" {...common} />
        </svg>
      );
    case "inc":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <path d="M12 20 L6 8 M12 20 L18 8" {...common} />
          <path d="M4 6 L8 10 M8 6 L4 10" {...common} strokeWidth={1.4} />
          <path d="M16 6 L20 10 M20 6 L16 10" {...common} strokeWidth={1.4} />
        </svg>
      );
    case "dec":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <path d="M6 6 L12 18 L18 6" {...common} />
        </svg>
      );
    case "mr":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="7" {...common} />
          <circle cx="12" cy="12" r="2.2" fill={color} stroke="none" />
        </svg>
      );
    case "skip":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <path d="M6 12 H18" {...common} strokeDasharray="2 2.5" />
        </svg>
      );
    case "join":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <path d="M7 12 H17 M12 7 V17" {...common} />
          <circle cx="12" cy="12" r="6" {...common} />
        </svg>
      );
    case "fo":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <path d="M6 6 L18 18 M18 6 L6 18" {...common} />
          <circle cx="12" cy="12" r="8" {...common} opacity={0.35} />
        </svg>
      );
    case "blo":
    case "flo":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <path d="M5 14 Q12 6 19 14" {...common} />
          <path
            d="M5 17 Q12 10 19 17"
            {...common}
            opacity={kind === "blo" ? 0.35 : 1}
          />
        </svg>
      );
    case "turn":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <path d="M7 16 H15 A4 4 0 0 0 15 8 H11" {...common} />
          <path d="M11 5 L8 8 L11 11" {...common} />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <rect
            x="5"
            y="7"
            width="14"
            height="10"
            rx="2"
            {...common}
            fill="rgba(217,107,82,0.08)"
          />
        </svg>
      );
  }
}

/** True for flat / row-worked pieces (not amigurumi in the round). */
export function isFlatConstruction(component: PatternComponent): boolean {
  return detectConstructionMode(component) === "row";
}

function FlatRowChart({
  symbols,
  roundNumber,
  result,
  rowLabel,
}: {
  symbols: ChartSymbol[];
  roundNumber: number;
  result: number;
  rowLabel: string;
}) {
  const runs = collapseSymbolRuns(
    symbols.filter((s) => s.kind !== "text" && s.kind !== "fo")
  );
  const glyphs: ChartSymbol[] = [];
  for (const run of runs) {
    const n = Math.min(
      run.count || 1,
      run.kind === "ch" || run.kind === "sc" ? 12 : 6
    );
    for (let i = 0; i < n; i++) glyphs.push({ kind: run.kind });
  }

  return (
    <div className="rounded-[1.25rem] border border-line bg-[linear-gradient(180deg,#f7f1e8_0%,#efe7db_100%)] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          {rowLabel} {roundNumber} · left → right
        </p>
        <p className="text-xs font-bold text-ink">{result} sts</p>
      </div>

      <div className="mt-4 overflow-x-auto pb-1">
        <div className="flex min-w-max items-center gap-3">
          {runs.map((run, ri) => (
            <div key={`${run.kind}-${ri}`} className="flex items-center gap-2">
              {ri > 0 ? (
                <span className="text-xs font-bold text-muted/50">→</span>
              ) : null}
              <div className="rounded-xl border border-line/80 bg-bone px-3 py-2 shadow-sm">
                <div className="flex items-center gap-0.5">
                  {Array.from({
                    length: Math.min(run.count || 1, 8),
                  }).map((_, i) => (
                    <span
                      key={i}
                      className="inline-flex h-7 w-4 items-center justify-center"
                    >
                      <SymbolGlyph kind={run.kind} size={15} />
                    </span>
                  ))}
                  {(run.count || 1) > 8 ? (
                    <span className="pl-1 text-[10px] font-bold text-muted">
                      …
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-center text-[11px] font-bold text-ink">
                  {SYMBOL_LABELS[run.kind]} ×{run.count || 1}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {glyphs.length === 0 ? (
        <p className="mt-3 text-center text-xs text-muted">No stitch symbols</p>
      ) : null}
    </div>
  );
}

function CircularRoundChart({
  symbols,
  roundNumber,
  result,
}: {
  symbols: ChartSymbol[];
  roundNumber: number;
  result: number;
}) {
  // For in-the-round charts, prefer working stitches (skip pure leading chain runs
  // when the round is MR-based). Keep MR marker in center.
  const drawable = symbols.filter((s) => s.kind !== "text" && s.kind !== "fo");
  const hasMr = drawable.some((s) => s.kind === "mr");
  let stitches = drawable.filter((s) => s.kind !== "mr");
  // If MR + sc ring, don't also paint a huge unrelated ring from bad ops
  if (hasMr) {
    stitches = stitches.filter((s) => s.kind !== "ch");
  }

  const n = Math.max(stitches.length, 1);
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const ringR = Math.min(118, 42 + Math.sqrt(Math.min(n, 96)) * 10);
  const maxDraw = 72;
  const step = n > maxDraw ? Math.ceil(n / maxDraw) : 1;
  const shown = stitches.filter((_, i) => i % step === 0);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto h-auto w-full max-w-[340px]"
      role="img"
      aria-label={`Round ${roundNumber} crochet chart, ${result} stitches`}
    >
      <circle
        cx={cx}
        cy={cy}
        r={ringR + 22}
        fill="#f7f1e8"
        stroke="rgba(43,37,34,0.06)"
      />
      <circle
        cx={cx}
        cy={cy}
        r={ringR}
        fill="none"
        stroke="rgba(217,107,82,0.25)"
        strokeWidth="1.2"
        strokeDasharray="3 4"
      />
      {hasMr ? (
        <g transform={`translate(${cx - 14} ${cy - 14})`}>
          <SymbolGlyph kind="mr" size={28} color={ACCENT} />
        </g>
      ) : (
        <circle cx={cx} cy={cy} r="10" fill={ACCENT} opacity="0.2" />
      )}
      <text
        x={cx}
        y={hasMr ? cy + 28 : cy + 4}
        textAnchor="middle"
        style={{ fontSize: 11, fontWeight: 700, fill: "#6e655e" }}
      >
        R{roundNumber}
        {result > 0 ? ` · ${result} sts` : symbols.some((s) => s.kind === "fo") ? " · FO" : ""}
      </text>

      {shown.map((sym, i) => {
        const idx = i * step;
        const angle = -Math.PI / 2 + (idx / n) * Math.PI * 2;
        const x = cx + Math.cos(angle) * ringR;
        const y = cy + Math.sin(angle) * ringR;
        const deg = (angle * 180) / Math.PI + 90;
        return (
          <g
            key={`${sym.kind}-${idx}`}
            transform={`translate(${x} ${y}) rotate(${deg})`}
          >
            <g transform="translate(-9 -9)">
              <SymbolGlyph kind={sym.kind} size={18} color={INK} />
            </g>
          </g>
        );
      })}
      {step > 1 ? (
        <text
          x={cx}
          y={size - 14}
          textAnchor="middle"
          style={{ fontSize: 10, fill: "#9a938a" }}
        >
          Sampled view · {result} stitches in round
        </text>
      ) : null}
    </svg>
  );
}

function LinearSymbolStrip({ symbols }: { symbols: ChartSymbol[] }) {
  const runs = collapseSymbolRuns(symbols).slice(0, 48);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {runs.map((s, i) => (
        <span
          key={`${s.kind}-${i}`}
          className="inline-flex items-center gap-1 rounded-lg border border-line bg-bg px-1.5 py-1"
          title={SYMBOL_LABELS[s.kind]}
        >
          <SymbolGlyph kind={s.kind} size={16} />
          {(s.count || 1) > 1 ? (
            <span className="text-[10px] font-bold text-muted">×{s.count}</span>
          ) : null}
          {s.label ? (
            <span className="max-w-[4.5rem] truncate text-[10px] text-muted">
              {s.label}
            </span>
          ) : null}
        </span>
      ))}
      {collapseSymbolRuns(symbols).length > 48 ? (
        <span className="text-xs text-muted">…</span>
      ) : null}
    </div>
  );
}

function SymbolLegend({
  title,
  kinds,
}: {
  title: string;
  kinds: ChartSymbolKind[];
}) {
  const unique = [...new Set(kinds)].filter((k) => k !== "text");
  if (!unique.length) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
        {title}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {unique.map((k) => (
          <li
            key={k}
            className="inline-flex items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1 text-xs text-ink"
          >
            <SymbolGlyph kind={k} size={14} color={ACCENT} />
            {SYMBOL_LABELS[k]}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CrochetStitchDiagram({
  component,
  title,
  subtitle,
  flatSubtitle,
  roundLabel,
  rowLabel,
  writtenOrderLabel,
  legendLabel,
  previewOnly,
  activeRoundNumber,
  onActiveRoundNumberChange,
}: {
  component: PatternComponent;
  title: string;
  subtitle: string;
  flatSubtitle?: string;
  roundLabel: string;
  rowLabel?: string;
  writtenOrderLabel: string;
  legendLabel: string;
  previewOnly?: boolean;
  /** Controlled round selection (studio workspace). */
  activeRoundNumber?: number;
  onActiveRoundNumberChange?: (round: number) => void;
}) {
  const mode = detectConstructionMode(component);
  const flat = mode === "row";
  const stepLabel = flat ? rowLabel || "Row" : roundLabel;

  const chartableRounds = useMemo(
    () =>
      mode === "note" ? [] : diagramRounds(component.rounds || []),
    [component.rounds, mode]
  );

  const [internalRound, setInternalRound] = useState(
    () => chartableRounds[0]?.round ?? component.rounds[0]?.round ?? 1
  );

  const activeRound =
    typeof activeRoundNumber === "number" ? activeRoundNumber : internalRound;

  function selectRound(n: number) {
    if (onActiveRoundNumberChange) onActiveRoundNumberChange(n);
    else setInternalRound(n);
  }

  // Keep internal selection valid when component changes
  useEffect(() => {
    if (typeof activeRoundNumber === "number") return;
    if (
      chartableRounds.length &&
      !chartableRounds.some((r) => r.round === internalRound)
    ) {
      setInternalRound(chartableRounds[0].round);
    }
  }, [chartableRounds, internalRound, activeRoundNumber]);

  const round: PatternRound | undefined =
    chartableRounds.find((r) => r.round === activeRound) ||
    chartableRounds.find((r) => r.round === internalRound) ||
    chartableRounds[0];

  const symbols = useMemo(
    () => expandOperationsToSymbols(round?.operations),
    [round]
  );

  // No customer-facing empty/debug message — hide the section entirely
  if (mode === "note" || !chartableRounds.length || !round) {
    return null;
  }

  const roundsToShow = previewOnly
    ? chartableRounds.slice(0, 1)
    : chartableRounds;

  return (
    <div className="border-t border-line bg-[#fffdf9]">
      <div className="border-b border-line px-5 py-3 sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
          {title}
        </p>
        <p className="mt-1 text-sm text-muted">
          {flat
            ? flatSubtitle ||
              "Flat row chart with standard crochet symbols — read left to right."
            : subtitle}
        </p>
      </div>

      {!previewOnly && roundsToShow.length > 1 ? (
        <div className="flex gap-1.5 overflow-x-auto border-b border-line px-4 py-3 sm:px-5">
          {roundsToShow.map((r) => {
            const on = r.round === round.round;
            return (
              <button
                key={r.round}
                type="button"
                onClick={() => selectRound(r.round)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  on
                    ? "bg-apricot text-bone"
                    : "bg-elevated text-muted hover:text-ink"
                }`}
              >
                {stepLabel} {r.round}
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        className={`grid gap-5 p-4 sm:p-5 ${
          flat ? "" : "sm:grid-cols-[1fr_1fr]"
        }`}
      >
        {flat ? (
          <FlatRowChart
            symbols={symbols}
            roundNumber={round.round}
            result={round.result}
            rowLabel={stepLabel}
          />
        ) : (
          <CircularRoundChart
            symbols={symbols}
            roundNumber={round.round}
            result={round.result}
          />
        )}
        <div className="flex flex-col justify-center gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
              {writtenOrderLabel}
            </p>
            <p className="mt-1 text-sm text-ink/80">{round.instructions}</p>
            {!flat ? (
              <div className="mt-3">
                <LinearSymbolStrip symbols={symbols} />
              </div>
            ) : (
              <div className="mt-3">
                <LinearSymbolStrip symbols={symbols} />
              </div>
            )}
          </div>
          <SymbolLegend
            title={legendLabel}
            kinds={symbols.map((s) => s.kind)}
          />
          {previewOnly ? (
            <p className="text-xs text-muted">
              +{Math.max(0, chartableRounds.length - 1)} more{" "}
              {flat ? "rows" : "rounds"} in full pattern
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
