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
import {
  StitchCountChart,
} from "@/components/site/PatternVisualGuide";
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

  const [pieceId, setPieceId] = useState(pieces[0]?.id || "");
  const piece =
    pieces.find((p) => p.id === pieceId) || pieces[0] || null;

  const mode = piece ? detectConstructionMode(piece) : "note";
  const stepLabel = stepLabelForMode(mode);
  const { title: pieceTitle, makeSuffix } = piece
    ? cleanComponentDisplayName(piece.name, piece.make)
    : { title: "", makeSuffix: "" };

  const { main, accessories } = useMemo(
    () =>
      piece
        ? partitionComponentRounds(piece.rounds || [])
        : { main: [], accessories: [] },
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
  const [focusIndex, setFocusIndex] = useState(0);
  const [doneSet, setDoneSet] = useState<Set<number>>(new Set());

  // Reset focus when switching piece
  useEffect(() => {
    setFocusIndex(0);
  }, [pieceId]);

  useEffect(() => {
    if (!piece) return;
    const sync = () => {
      setDoneSet(new Set(getCompletedRounds(patternId, piece.id)));
    };
    sync();
    window.addEventListener("loopcraft:progress", sync);
    return () => window.removeEventListener("loopcraft:progress", sync);
  }, [patternId, piece]);

  // Deep-link: #part-x or #r-x-n
  useEffect(() => {
    if (typeof window === "undefined") return;
    const applyHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;
      const partMatch = hash.match(/^part-(.+)$/);
      if (partMatch && pieces.some((p) => p.id === partMatch[1])) {
        setPieceId(partMatch[1]);
        return;
      }
      const roundMatch = hash.match(/^r-(.+)-(\d+|fo)$/);
      if (roundMatch) {
        const [, cid, token] = roundMatch;
        if (pieces.some((p) => p.id === cid)) setPieceId(cid);
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [pieces]);

  // After piece loads, honor round hash
  useEffect(() => {
    if (!piece || !steps.length) return;
    const hash = window.location.hash.replace(/^#/, "");
    const roundMatch = hash.match(new RegExp(`^r-${piece.id}-(\\d+|fo)$`));
    if (!roundMatch) return;
    const token = roundMatch[1];
    const idx =
      token === "fo"
        ? steps.findIndex((s) => s.fo)
        : steps.findIndex((s) => !s.fo && s.round.round === Number(token));
    if (idx >= 0) setFocusIndex(idx);
  }, [piece, steps]);

  if (!piece) return null;

  const safeFocus = Math.min(focusIndex, Math.max(steps.length - 1, 0));
  const current = steps[safeFocus];
  const activeRoundNumber = current && !current.fo ? current.round.round : undefined;
  const doneCount = trackable.filter((s) =>
    doneSet.has(s.round.round)
  ).length;
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
    if (!s || !piece) return;
    const id = roundAnchor(piece.id, s.round.round, s.fo);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function toggleDone(roundNum: number) {
    if (!piece) return;
    toggleRoundComplete(patternId, piece.id, roundNum);
  }

  const filteredAccessories = accessories.filter(
    (acc) =>
      !acc.steps.every((s) =>
        /\bassembl\w*|sew together|closing\b/i.test(s.instructions || "")
      )
  );

  return (
    <section className="mt-16" id="instructions">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-ink">
            {labels.instructions}
          </h2>
          <p className="mt-1 text-sm text-muted">{labels.focusHint}</p>
        </div>
        {trackable.length > 0 ? (
          <p className="text-sm font-semibold text-muted">
            {formatProgress(
              labels.progressTemplate,
              doneCount,
              trackable.length
            )}
          </p>
        ) : null}
      </div>

      {/* Piece tabs */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {pieces.map((p, i) => {
          const { title } = cleanComponentDisplayName(p.name, p.make);
          const on = p.id === piece.id;
          return (
            <button
              key={p.id}
              type="button"
              id={`part-${p.id}`}
              onClick={() => {
                setPieceId(p.id);
                window.history.replaceState(null, "", `#part-${p.id}`);
              }}
              className={cn(
                "scroll-mt-36 shrink-0 rounded-full px-4 py-2 text-sm font-bold transition",
                on
                  ? "bg-apricot text-bone shadow-[0_8px_20px_rgba(217,107,82,0.28)]"
                  : "bg-elevated text-muted hover:text-ink"
              )}
            >
              <span className="mr-1.5 opacity-70">{i + 1}.</span>
              {title}
            </button>
          );
        })}
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-line bg-[#fffdf9] shadow-[0_16px_40px_rgba(43,37,34,0.06)]">
        {/* Piece header + progress */}
        <div className="bg-apricot px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-2xl text-bone">
              {pieceTitle}
              {makeSuffix}
            </h3>
            <span className="rounded-full bg-bone/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-bone/90">
              {mode === "note" ? "Note" : stepLabel}
            </span>
          </div>
          {trackable.length > 0 ? (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bone/20">
              <div
                className="h-full rounded-full bg-bone transition-[width] duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          ) : null}
        </div>

        {mode === "note" ? (
          <div className="space-y-3 px-5 py-5 text-sm text-ink sm:px-6">
            {(piece.rounds || []).map((r) => (
              <p key={r.round}>{r.instructions}</p>
            ))}
          </div>
        ) : (
          <>
            {/* Sticky jump chips for this piece */}
            {steps.length > 0 ? (
              <div className="sticky top-[4.75rem] z-20 border-b border-line bg-[#fffdf9]/95 px-4 py-3 backdrop-blur-md sm:px-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
                  {labels.jumpToRound}
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                  {steps.map((s) => {
                    const on = s.index === safeFocus;
                    const done =
                      !s.fo && doneSet.has(s.round.round);
                    return (
                      <button
                        key={`${s.round.round}-${s.index}`}
                        type="button"
                        onClick={() => selectStep(s.index)}
                        className={cn(
                          "relative shrink-0 rounded-full px-2.5 py-1 text-xs font-bold transition",
                          on
                            ? "bg-apricot text-bone"
                            : done
                              ? "bg-celadon/20 text-celadon"
                              : "bg-elevated text-ink hover:bg-ink hover:text-bone"
                        )}
                      >
                        {s.fo ? "FO" : `${stepLabel}${s.round.round}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Focus card */}
            {current ? (
              <div className="border-b border-line bg-[linear-gradient(165deg,#fffdf9_0%,#f7f1e8_100%)] px-5 py-6 sm:px-8">
                <div className="mx-auto max-w-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                        {labels.roundOf
                          .replace("{current}", String(safeFocus + 1))
                          .replace("{total}", String(steps.length))}
                      </p>
                      <p className="mt-2 font-display text-5xl text-apricot sm:text-6xl">
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
                          "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition",
                          doneSet.has(current.round.round)
                            ? "bg-celadon text-bone"
                            : "border border-line bg-bg text-ink hover:border-apricot/40"
                        )}
                      >
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                        {doneSet.has(current.round.round)
                          ? labels.markedComplete
                          : labels.markComplete}
                      </button>
                    ) : null}
                  </div>

                  <p className="mt-5 text-lg leading-relaxed text-ink sm:text-xl">
                    {current.round.instructions}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {!current.fo &&
                    typeof current.round.result === "number" &&
                    current.round.result > 0 ? (
                      <span className="rounded-full bg-ink px-3 py-1.5 text-sm font-bold text-bone">
                        {current.round.result} sts
                      </span>
                    ) : null}
                    <div className="ml-auto flex gap-2">
                      <button
                        type="button"
                        disabled={safeFocus <= 0}
                        onClick={() => go(-1)}
                        className="inline-flex items-center gap-1 rounded-full border border-line bg-bg px-3 py-2 text-sm font-bold text-ink transition hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {labels.previous}
                      </button>
                      <button
                        type="button"
                        disabled={safeFocus >= steps.length - 1}
                        onClick={() => go(1)}
                        className="inline-flex items-center gap-1 rounded-full bg-apricot px-3 py-2 text-sm font-bold text-bone transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {labels.next}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Visuals synced to focus */}
            <StitchCountChart
              component={piece}
              title={
                mode === "row"
                  ? labels.stitchChartRows
                  : labels.stitchChart
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

            {/* Compact list */}
            <div className="space-y-2 px-4 py-5 sm:px-5">
              {steps.map((s) => {
                const on = s.index === safeFocus;
                const done = !s.fo && doneSet.has(s.round.round);
                const anchor = roundAnchor(
                  piece.id,
                  s.round.round,
                  s.fo
                );
                return (
                  <div
                    key={anchor}
                    id={anchor}
                    className={cn(
                      "scroll-mt-40 flex gap-3 rounded-2xl border px-4 py-3 transition",
                      on
                        ? "border-apricot/50 bg-apricot/5 shadow-[0_8px_24px_rgba(217,107,82,0.08)]"
                        : done
                          ? "border-celadon/30 bg-celadon/5"
                          : "border-line/80 bg-bg/70 hover:border-line"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => selectStep(s.index)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-baseline gap-3">
                        <span
                          className={cn(
                            "font-display text-xl",
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
                        <span className="mt-1 inline-block text-xs font-bold text-muted">
                          {s.round.result} sts
                        </span>
                      ) : null}
                    </button>
                    {!s.fo ? (
                      <button
                        type="button"
                        onClick={() => toggleDone(s.round.round)}
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition",
                          done
                            ? "bg-celadon text-bone"
                            : "bg-elevated text-muted hover:text-ink"
                        )}
                        aria-pressed={done}
                        title={
                          done
                            ? labels.markedComplete
                            : labels.markComplete
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
              <div className="border-t border-line px-5 py-5 sm:px-6">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
                  {labels.accessories}
                </p>
                <div className="space-y-4">
                  {filteredAccessories.map((acc) => (
                    <div key={acc.title}>
                      <h4 className="font-display text-lg text-ink">
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
      </div>
    </section>
  );
}
