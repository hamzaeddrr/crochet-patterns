"use client";

import { useEffect, useMemo, useState } from "react";
import type { PatternComponent, PatternRound } from "@/types";
import {
  cleanComponentDisplayName,
  detectConstructionMode,
  isFastenOffRound,
  isRedundantNoteComponent,
  partitionComponentRounds,
  stepLabelForMode,
} from "@/lib/crochet/construction";
import {
  getCompletedRounds,
  toggleRoundComplete,
} from "@/lib/client/pattern-progress";
import { roundAnchor } from "@/lib/crochet/jump-chips";
import { StitchCountChart } from "@/components/site/PatternVisualGuide";
import { CrochetStitchDiagram } from "@/components/site/CrochetStitchDiagram";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StudioLabels = {
  instructions: string;
  jumpToRound: string;
  progressTemplate: string;
  markComplete: string;
  markedComplete: string;
  next: string;
  previous: string;
  focusHint: string;
  roundOf: string;
  accessories: string;
  stitchChart: string;
  stitchChartRows: string;
  stitchDiagramTitle: string;
  stitchDiagramSubtitle: string;
  stitchDiagramFlatSubtitle: string;
  stitchDiagramRound: string;
  stitchDiagramRow: string;
  stitchDiagramWritten: string;
  stitchDiagramLegend: string;
};

type Step = {
  round: PatternRound;
  fo: boolean;
  index: number;
};

function formatProgress(template: string, done: number, total: number) {
  return template
    .replace("{done}", String(done))
    .replace("{total}", String(total));
}

function PiecePanel({
  patternId,
  piece,
  pieceIndex,
  labels,
  initialFocus,
}: {
  patternId: string;
  piece: PatternComponent;
  pieceIndex: number;
  labels: StudioLabels;
  initialFocus?: number;
}) {
  const mode = detectConstructionMode(piece);
  const stepLabel = stepLabelForMode(mode);
  const { title: pieceTitle, makeSuffix } = cleanComponentDisplayName(
    piece.name,
    piece.make
  );

  const { main, accessories } = useMemo(
    () => partitionComponentRounds(piece.rounds || []),
    [piece]
  );

  const steps: Step[] = useMemo(
    () =>
      main.map((round, index) => ({
        round,
        fo: isFastenOffRound(round),
        index,
      })),
    [main]
  );

  const trackable = steps.filter((s) => !s.fo);
  const [focusIndex, setFocusIndex] = useState(
    typeof initialFocus === "number" ? initialFocus : 0
  );
  const [doneSet, setDoneSet] = useState<Set<number>>(new Set());

  useEffect(() => {
    const sync = () => {
      setDoneSet(new Set(getCompletedRounds(patternId, piece.id)));
    };
    sync();
    window.addEventListener("loopcraft:progress", sync);
    return () => window.removeEventListener("loopcraft:progress", sync);
  }, [patternId, piece.id]);

  useEffect(() => {
    if (typeof initialFocus === "number" && initialFocus >= 0) {
      setFocusIndex(initialFocus);
    }
  }, [initialFocus]);

  const safeFocus = Math.min(focusIndex, Math.max(steps.length - 1, 0));
  const current = steps[safeFocus];
  const activeRoundNumber =
    current && !current.fo ? current.round.round : undefined;
  const doneCount = trackable.filter((s) => doneSet.has(s.round.round)).length;
  const progressPct =
    trackable.length > 0
      ? Math.round((doneCount / trackable.length) * 100)
      : 0;

  function go(delta: number) {
    setFocusIndex((i) =>
      Math.max(0, Math.min(steps.length - 1, i + delta))
    );
  }

  function selectStep(index: number) {
    setFocusIndex(index);
    const s = steps[index];
    if (!s) return;
    const id = roundAnchor(piece.id, s.round.round, s.fo);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }

  function toggleDone(roundNum: number) {
    const wasDone = doneSet.has(roundNum);
    toggleRoundComplete(patternId, piece.id, roundNum);
    // Advance to next incomplete when marking complete
    if (!wasDone) {
      const nextIdx = steps.findIndex(
        (s, i) =>
          i > safeFocus && !s.fo && !doneSet.has(s.round.round) && s.round.round !== roundNum
      );
      if (nextIdx >= 0) setFocusIndex(nextIdx);
      else if (safeFocus < steps.length - 1) go(1);
    }
  }

  const filteredAccessories = accessories.filter(
    (acc) =>
      !acc.steps.every((s) =>
        /\bassembl\w*|sew together|closing\b/i.test(s.instructions || "")
      )
  );

  return (
    <article
      id={`part-${piece.id}`}
      className="scroll-mt-28 overflow-hidden rounded-[1.35rem] border border-line bg-[#fffdf9] shadow-[0_12px_32px_rgba(43,37,34,0.05)] sm:scroll-mt-32 sm:rounded-[1.75rem]"
    >
      <div className="bg-apricot px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-xl text-bone sm:text-2xl">
            <span className="mr-2 opacity-70">{pieceIndex + 1}.</span>
            {pieceTitle}
            {makeSuffix}
          </h3>
          <span className="rounded-full bg-bone/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-bone/90 sm:text-xs">
            {mode === "note" ? "Note" : stepLabel}
          </span>
        </div>
        {trackable.length > 0 ? (
          <div className="mt-2.5 flex items-center gap-3">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-bone/20">
              <div
                className="h-full rounded-full bg-bone transition-[width] duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="shrink-0 text-xs font-semibold text-bone/90">
              {formatProgress(
                labels.progressTemplate,
                doneCount,
                trackable.length
              )}
            </p>
          </div>
        ) : null}
      </div>

      {mode === "note" ? (
        <div className="space-y-3 px-4 py-4 text-sm text-ink sm:px-6 sm:py-5">
          {(piece.rounds || []).map((r) => (
            <p key={r.round}>{r.instructions}</p>
          ))}
        </div>
      ) : (
        <>
          {steps.length > 0 ? (
            <div className="sticky top-[7.25rem] z-20 border-b border-line bg-[#fffdf9]/95 px-3 py-2.5 backdrop-blur-md sm:top-[7.75rem] sm:px-5 sm:py-3">
              <div className="flex items-center gap-2">
                <p className="hidden shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-gold sm:block">
                  {labels.jumpToRound}
                </p>
                <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {steps.map((s) => {
                    const on = s.index === safeFocus;
                    const done = !s.fo && doneSet.has(s.round.round);
                    return (
                      <button
                        key={`${s.round.round}-${s.index}`}
                        type="button"
                        onClick={() => selectStep(s.index)}
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold transition",
                          on
                            ? "bg-apricot text-bone"
                            : done
                              ? "bg-celadon/20 text-celadon"
                              : "bg-elevated text-ink"
                        )}
                      >
                        {s.fo ? "FO" : `${stepLabel}${s.round.round}`}
                      </button>
                    );
                  })}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    disabled={safeFocus <= 0}
                    onClick={() => go(-1)}
                    aria-label={labels.previous}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-bg text-ink disabled:opacity-35"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={safeFocus >= steps.length - 1}
                    onClick={() => go(1)}
                    aria-label={labels.next}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-apricot text-bone disabled:opacity-35"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Highlighted current round — content also in list below */}
          {current ? (
            <div className="border-b border-line bg-[linear-gradient(165deg,#fffdf9_0%,#f7f1e8_100%)] px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
                    {labels.roundOf
                      .replace("{current}", String(safeFocus + 1))
                      .replace("{total}", String(steps.length))}
                  </p>
                  <p className="mt-1 font-display text-3xl text-apricot sm:text-4xl">
                    {current.fo
                      ? "FO"
                      : `${stepLabel} ${current.round.round}`}
                  </p>
                </div>
                {!current.fo ? (
                  <button
                    type="button"
                    onClick={() => toggleDone(current.round.round)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition sm:px-4 sm:text-sm",
                      doneSet.has(current.round.round)
                        ? "bg-celadon text-bone"
                        : "border border-line bg-bg text-ink"
                    )}
                  >
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                    <span className="hidden sm:inline">
                      {doneSet.has(current.round.round)
                        ? labels.markedComplete
                        : labels.markComplete}
                    </span>
                  </button>
                ) : null}
              </div>
              <p className="mt-3 text-base leading-relaxed text-ink sm:text-lg">
                {current.round.instructions}
              </p>
              {!current.fo &&
              typeof current.round.result === "number" &&
              current.round.result > 0 ? (
                <span className="mt-3 inline-block rounded-full bg-ink px-3 py-1 text-xs font-bold text-bone sm:text-sm">
                  {current.round.result} sts
                </span>
              ) : null}
            </div>
          ) : null}

          <StitchCountChart
            component={piece}
            title={
              mode === "row" ? labels.stitchChartRows : labels.stitchChart
            }
            highlightRound={activeRoundNumber}
          />
          <CrochetStitchDiagram
            component={piece}
            title={labels.stitchDiagramTitle}
            subtitle={labels.stitchDiagramSubtitle}
            flatSubtitle={labels.stitchDiagramFlatSubtitle}
            roundLabel={labels.stitchDiagramRound}
            rowLabel={labels.stitchDiagramRow}
            writtenOrderLabel={labels.stitchDiagramWritten}
            legendLabel={labels.stitchDiagramLegend}
            activeRoundNumber={activeRoundNumber}
            onActiveRoundNumberChange={(n) => {
              const idx = steps.findIndex(
                (s) => !s.fo && s.round.round === n
              );
              if (idx >= 0) setFocusIndex(idx);
            }}
          />

          <div className="space-y-2 px-3 py-4 sm:px-5 sm:py-5">
            {steps.map((s) => {
              const on = s.index === safeFocus;
              const done = !s.fo && doneSet.has(s.round.round);
              const anchor = roundAnchor(piece.id, s.round.round, s.fo);
              return (
                <div
                  key={anchor}
                  id={anchor}
                  className={cn(
                    "scroll-mt-36 flex gap-2.5 rounded-2xl border px-3 py-3 transition sm:gap-3 sm:px-4",
                    on
                      ? "border-apricot/50 bg-apricot/5"
                      : done
                        ? "border-celadon/30 bg-celadon/5"
                        : "border-line/80 bg-bg/70"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => selectStep(s.index)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex gap-2.5 sm:items-baseline sm:gap-3">
                      <span
                        className={cn(
                          "shrink-0 font-display text-lg sm:text-xl",
                          on ? "text-apricot" : "text-gold"
                        )}
                      >
                        {s.fo ? "FO" : s.round.round}
                      </span>
                      <span className="text-sm leading-relaxed text-ink">
                        {s.round.instructions}
                      </span>
                    </div>
                    {!s.fo &&
                    typeof s.round.result === "number" &&
                    s.round.result > 0 ? (
                      <span className="mt-1 ml-8 inline-block text-xs font-bold text-muted sm:ml-9">
                        {s.round.result} sts
                      </span>
                    ) : null}
                  </button>
                  {!s.fo ? (
                    <button
                      type="button"
                      onClick={() => toggleDone(s.round.round)}
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition",
                        done
                          ? "bg-celadon text-bone"
                          : "bg-elevated text-muted"
                      )}
                      aria-pressed={done}
                      title={
                        done ? labels.markedComplete : labels.markComplete
                      }
                    >
                      {done ? "✓" : "○"}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          {filteredAccessories.length > 0 ? (
            <div className="border-t border-line px-4 py-4 sm:px-6 sm:py-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
                {labels.accessories}
              </p>
              <div className="space-y-4">
                {filteredAccessories.map((acc) => (
                  <div key={acc.title}>
                    <h4 className="font-display text-base text-ink sm:text-lg">
                      {acc.title}
                    </h4>
                    <ul className="mt-2 space-y-2 text-sm text-muted">
                      {acc.steps.map((step, i) => (
                        <li key={`${acc.title}-${i}`}>
                          • {step.instructions}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}

export function PatternStudioWorkspace({
  patternId,
  components,
  labels,
}: {
  patternId: string;
  components: PatternComponent[];
  labels: StudioLabels;
}) {
  const pieces = useMemo(
    () => components.filter((c) => !isRedundantNoteComponent(c)),
    [components]
  );

  const [hashFocus, setHashFocus] = useState<{
    pieceId: string;
    stepIndex: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const applyHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) {
        setHashFocus(null);
        return;
      }
      const partMatch = hash.match(/^part-(.+)$/);
      if (partMatch) {
        setHashFocus({ pieceId: partMatch[1], stepIndex: 0 });
        return;
      }
      const roundMatch = hash.match(/^r-(.+)-(\d+|fo)$/);
      if (roundMatch) {
        const [, cid, token] = roundMatch;
        const piece = pieces.find((p) => p.id === cid);
        if (!piece) return;
        const mode = detectConstructionMode(piece);
        if (mode === "note") {
          setHashFocus({ pieceId: cid, stepIndex: 0 });
          return;
        }
        const { main } = partitionComponentRounds(piece.rounds || []);
        const steps = main.map((round, index) => ({
          round,
          fo: isFastenOffRound(round),
          index,
        }));
        const idx =
          token === "fo"
            ? steps.findIndex((s) => s.fo)
            : steps.findIndex(
                (s) => !s.fo && s.round.round === Number(token)
              );
        setHashFocus({
          pieceId: cid,
          stepIndex: idx >= 0 ? idx : 0,
        });
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [pieces]);

  if (!pieces.length) return null;

  return (
    <section className="mt-12 sm:mt-16" id="instructions">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">
            {labels.instructions}
          </h2>
          <p className="mt-1 text-sm text-muted">{labels.focusHint}</p>
        </div>
      </div>

      {/* Jump to piece — scrolls, does not hide other pieces */}
      <nav
        aria-label="Pieces"
        className="sticky top-[4.5rem] z-30 mt-5 -mx-1 overflow-x-auto px-1 pb-1 sm:top-[5rem] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-max gap-2 rounded-full border border-line/80 bg-bg/90 p-1.5 shadow-[0_8px_24px_rgba(43,37,34,0.06)] backdrop-blur-md">
          {pieces.map((p, i) => {
            const { title } = cleanComponentDisplayName(p.name, p.make);
            return (
              <a
                key={p.id}
                href={`#part-${p.id}`}
                className="shrink-0 rounded-full bg-elevated px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-apricot hover:text-bone sm:text-sm"
              >
                <span className="opacity-60">{i + 1}.</span> {title}
              </a>
            );
          })}
        </div>
      </nav>

      <div className="mt-5 space-y-6 sm:mt-6 sm:space-y-8">
        {pieces.map((piece, i) => (
          <PiecePanel
            key={piece.id}
            patternId={patternId}
            piece={piece}
            pieceIndex={i}
            labels={labels}
            initialFocus={
              hashFocus?.pieceId === piece.id
                ? hashFocus.stepIndex
                : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}
