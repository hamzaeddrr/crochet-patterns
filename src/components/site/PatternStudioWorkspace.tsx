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
  getStudioViewMode,
  setStudioViewMode,
  subscribeStudioPrefs,
  type StudioViewMode,
} from "@/lib/client/studio-prefs";
import { StitchCountChart } from "@/components/site/PatternVisualGuide";
import { CrochetStitchDiagram } from "@/components/site/CrochetStitchDiagram";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  LayoutDashboard,
  Focus,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TechniqueTutor } from "@/components/site/TechniqueTutor";
import type { TechniquePublic } from "@/types/techniques";

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
  stitchDiagramEnlarge: string;
  stitchDiagramClose: string;
  modeDashboard: string;
  modeFocus: string;
  modeList: string;
  modeHint: string;
  panelSteps: string;
  panelGraph: string;
  panelChart: string;
  roundsNav: string;
};

type Step = {
  round: PatternRound;
  fo: boolean;
  index: number;
};

type MobilePanel = "steps" | "graph" | "chart";

function formatProgress(template: string, done: number, total: number) {
  return template
    .replace("{done}", String(done))
    .replace("{total}", String(total));
}

function buildSteps(piece: PatternComponent): Step[] {
  const { main } = partitionComponentRounds(piece.rounds || []);
  return main.map((round, index) => ({
    round,
    fo: isFastenOffRound(round),
    index,
  }));
}

function scrollToPiece(id: string) {
  window.history.replaceState(null, "", `#part-${id}`);
  document
    .getElementById(`part-${id}`)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ModeSwitcher({
  mode,
  onChange,
  labels,
}: {
  mode: StudioViewMode;
  onChange: (m: StudioViewMode) => void;
  labels: StudioLabels;
}) {
  const options: {
    id: StudioViewMode;
    label: string;
    icon: typeof LayoutDashboard;
  }[] = [
    { id: "dashboard", label: labels.modeDashboard, icon: LayoutDashboard },
    { id: "focus", label: labels.modeFocus, icon: Focus },
    { id: "list", label: labels.modeList, icon: List },
  ];

  return (
    <div
      role="tablist"
      aria-label={labels.modeHint}
      className="inline-flex max-w-full overflow-x-auto rounded-full border border-line bg-bg p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const on = mode === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(opt.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition sm:px-3.5 sm:text-sm",
              on
                ? "bg-apricot text-bone shadow-[0_6px_16px_rgba(217,107,82,0.25)]"
                : "text-muted hover:text-ink"
            )}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.25} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Sticky jump strip — scrolls to pieces; never hides them. */
function PieceJumpNav({
  pieces,
  activePieceId,
}: {
  pieces: PatternComponent[];
  activePieceId?: string;
}) {
  return (
    <nav
      aria-label="Pieces"
      className="sticky top-[4.5rem] z-30 -mx-1 overflow-x-auto px-1 pb-1 sm:top-[5rem] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex w-max gap-2 rounded-full border border-line/80 bg-bg/95 p-1.5 shadow-[0_8px_24px_rgba(43,37,34,0.06)] backdrop-blur-md">
        {pieces.map((p, i) => {
          const { title } = cleanComponentDisplayName(p.name, p.make);
          const on = p.id === activePieceId;
          return (
            <a
              key={p.id}
              href={`#part-${p.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToPiece(p.id);
              }}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition sm:text-sm",
                on
                  ? "bg-apricot text-bone"
                  : "bg-elevated text-ink hover:bg-apricot/15"
              )}
            >
              <span className="opacity-60">{i + 1}.</span> {title}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

function RoundRail({
  steps,
  stepLabel,
  focusIndex,
  doneSet,
  onSelect,
  title,
}: {
  steps: Step[];
  stepLabel: string;
  focusIndex: number;
  doneSet: Set<number>;
  onSelect: (index: number) => void;
  title: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
        {title}
      </p>
      <div className="flex max-h-[min(22rem,45vh)] flex-col gap-1 overflow-y-auto pr-1">
        {steps.map((s) => {
          const on = s.index === focusIndex;
          const done = !s.fo && doneSet.has(s.round.round);
          return (
            <button
              key={`${s.round.round}-${s.index}`}
              type="button"
              onClick={() => onSelect(s.index)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm font-bold transition",
                on
                  ? "bg-apricot text-bone"
                  : done
                    ? "bg-celadon/15 text-celadon"
                    : "bg-elevated/80 text-ink hover:bg-elevated"
              )}
            >
              <span className="w-10 shrink-0 tabular-nums opacity-90">
                {s.fo ? "FO" : `${stepLabel}${s.round.round}`}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-xs font-medium",
                  on ? "text-bone/85" : "text-muted"
                )}
              >
                {s.round.instructions}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InstructionCard({
  current,
  stepLabel,
  safeFocus,
  stepsLength,
  doneSet,
  labels,
  onToggle,
  onPrev,
  onNext,
  compact,
  techniqueLibrary,
}: {
  current: Step;
  stepLabel: string;
  safeFocus: number;
  stepsLength: number;
  doneSet: Set<number>;
  labels: StudioLabels;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  compact?: boolean;
  techniqueLibrary?: TechniquePublic[];
}) {
  const done = !current.fo && doneSet.has(current.round.round);
  return (
    <div
      className={cn(
        "rounded-[1.25rem] border border-line bg-[linear-gradient(165deg,#fffdf9_0%,#f7f1e8_100%)]",
        compact ? "p-4" : "p-5 sm:p-6"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
            {labels.roundOf
              .replace("{current}", String(safeFocus + 1))
              .replace("{total}", String(stepsLength))}
          </p>
          <p
            className={cn(
              "mt-1 font-display text-apricot",
              compact ? "text-3xl" : "text-4xl sm:text-5xl"
            )}
          >
            {current.fo ? "FO" : `${stepLabel} ${current.round.round}`}
          </p>
        </div>
        {!current.fo ? (
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition sm:text-sm",
              done
                ? "bg-celadon text-bone"
                : "border border-line bg-bg text-ink"
            )}
          >
            <Check className="h-4 w-4" strokeWidth={2.5} />
            <span className="hidden sm:inline">
              {done ? labels.markedComplete : labels.markComplete}
            </span>
          </button>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-3 leading-relaxed text-ink",
          compact ? "text-base" : "text-base sm:text-lg"
        )}
      >
        {current.round.instructions}
      </p>
      <TechniqueTutor round={current.round} library={techniqueLibrary} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!current.fo &&
        typeof current.round.result === "number" &&
        current.round.result > 0 ? (
          <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-bone">
            {current.round.result} sts
          </span>
        ) : null}
        <div className="ml-auto flex gap-1.5">
          <button
            type="button"
            disabled={safeFocus <= 0}
            onClick={onPrev}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-bg px-3 py-2 text-sm font-bold disabled:opacity-35"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{labels.previous}</span>
          </button>
          <button
            type="button"
            disabled={safeFocus >= stepsLength - 1}
            onClick={onNext}
            className="inline-flex items-center gap-1 rounded-full bg-apricot px-3 py-2 text-sm font-bold text-bone disabled:opacity-35"
          >
            <span className="hidden sm:inline">{labels.next}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function VisualPanels({
  piece,
  mode,
  labels,
  activeRoundNumber,
  onRoundChange,
  showGraph,
  showChart,
}: {
  piece: PatternComponent;
  mode: ReturnType<typeof detectConstructionMode>;
  labels: StudioLabels;
  activeRoundNumber?: number;
  onRoundChange: (n: number) => void;
  showGraph?: boolean;
  showChart?: boolean;
}) {
  if (mode === "note") return null;
  return (
    <>
      {showGraph !== false ? (
        <div className="overflow-hidden rounded-[1.25rem] border border-line bg-[#fffdf9]">
          <StitchCountChart
            component={piece}
            title={
              mode === "row" ? labels.stitchChartRows : labels.stitchChart
            }
            highlightRound={activeRoundNumber}
          />
        </div>
      ) : null}
      {showChart !== false ? (
        <div className="overflow-hidden rounded-[1.25rem] border border-line bg-[#fffdf9]">
          <CrochetStitchDiagram
            component={piece}
            title={labels.stitchDiagramTitle}
            subtitle={labels.stitchDiagramSubtitle}
            flatSubtitle={labels.stitchDiagramFlatSubtitle}
            roundLabel={labels.stitchDiagramRound}
            rowLabel={labels.stitchDiagramRow}
            writtenOrderLabel={labels.stitchDiagramWritten}
            legendLabel={labels.stitchDiagramLegend}
            enlargeLabel={labels.stitchDiagramEnlarge}
            closeLabel={labels.stitchDiagramClose}
            activeRoundNumber={activeRoundNumber}
            onActiveRoundNumberChange={onRoundChange}
          />
        </div>
      ) : null}
    </>
  );
}

/** One piece block — always stacked; viewMode only changes layout inside. */
function StudioPieceBlock({
  patternId,
  piece,
  pieceIndex,
  labels,
  viewMode,
  initialFocus,
  onActivate,
  techniqueLibrary,
}: {
  patternId: string;
  piece: PatternComponent;
  pieceIndex: number;
  labels: StudioLabels;
  viewMode: StudioViewMode;
  initialFocus?: number;
  onActivate?: () => void;
  techniqueLibrary?: TechniquePublic[];
}) {
  const mode = detectConstructionMode(piece);
  const stepLabel = stepLabelForMode(mode);
  const { title: pieceTitle, makeSuffix } = cleanComponentDisplayName(
    piece.name,
    piece.make
  );
  const steps = useMemo(() => buildSteps(piece), [piece]);
  const trackable = steps.filter((s) => !s.fo);
  const [focusIndex, setFocusIndex] = useState(
    typeof initialFocus === "number" ? initialFocus : 0
  );
  const [doneSet, setDoneSet] = useState<Set<number>>(new Set());
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("steps");

  const { accessories } = useMemo(
    () => partitionComponentRounds(piece.rounds || []),
    [piece]
  );

  useEffect(() => {
    const sync = () =>
      setDoneSet(new Set(getCompletedRounds(patternId, piece.id)));
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

  const filteredAccessories = accessories.filter(
    (acc) =>
      !acc.steps.every((s) =>
        /\bassembl\w*|sew together|closing\b/i.test(s.instructions || "")
      )
  );

  function go(delta: number) {
    onActivate?.();
    setFocusIndex((i) =>
      Math.max(0, Math.min(steps.length - 1, i + delta))
    );
  }

  function selectStep(index: number) {
    onActivate?.();
    setFocusIndex(index);
    setMobilePanel("steps");
  }

  function onDiagramRound(n: number) {
    const idx = steps.findIndex((s) => !s.fo && s.round.round === n);
    if (idx >= 0) {
      onActivate?.();
      setFocusIndex(idx);
    }
  }

  function toggleDone(roundNum: number) {
    onActivate?.();
    const wasDone = doneSet.has(roundNum);
    toggleRoundComplete(patternId, piece.id, roundNum);
    if (!wasDone) {
      const nextIdx = steps.findIndex(
        (s, i) =>
          i > safeFocus &&
          !s.fo &&
          !doneSet.has(s.round.round) &&
          s.round.round !== roundNum
      );
      if (nextIdx >= 0) setFocusIndex(nextIdx);
      else if (safeFocus < steps.length - 1) go(1);
    }
  }

  return (
    <article
      id={`part-${piece.id}`}
      className="scroll-mt-32 overflow-hidden rounded-[1.35rem] border border-line bg-[#fffdf9] shadow-[0_12px_32px_rgba(43,37,34,0.05)] sm:scroll-mt-36 sm:rounded-[1.75rem]"
    >
      <div className="bg-apricot px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-xl text-bone sm:text-2xl">
            <span className="mr-2 opacity-70">{pieceIndex + 1}.</span>
            {pieceTitle}
            {makeSuffix}
          </h3>
          {trackable.length > 0 ? (
            <p className="text-xs font-semibold text-bone/90">
              {formatProgress(
                labels.progressTemplate,
                doneCount,
                trackable.length
              )}
            </p>
          ) : null}
        </div>
        {trackable.length > 0 ? (
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-bone/20">
            <div
              className="h-full rounded-full bg-bone transition-[width] duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        ) : null}
      </div>

      {mode === "note" ? (
        <div className="space-y-3 px-4 py-4 text-sm sm:px-6">
          {(piece.rounds || []).map((r) => (
            <p key={r.round}>{r.instructions}</p>
          ))}
        </div>
      ) : viewMode === "list" ? (
        <>
          <VisualPanels
            piece={piece}
            mode={mode}
            labels={labels}
            activeRoundNumber={activeRoundNumber}
            onRoundChange={onDiagramRound}
          />
          <div className="space-y-2 px-3 py-4 sm:px-4">
            {steps.map((s) => {
              const done = !s.fo && doneSet.has(s.round.round);
              const on = s.index === safeFocus;
              const anchor = roundAnchor(piece.id, s.round.round, s.fo);
              return (
                <div
                  key={anchor}
                  id={anchor}
                  className={cn(
                    "scroll-mt-36 flex gap-2.5 rounded-2xl border px-3 py-3",
                    on
                      ? "border-apricot/45 bg-apricot/5"
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
                    <div className="flex gap-2.5">
                      <span
                        className={cn(
                          "shrink-0 font-display text-lg",
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
                      <span className="mt-1 ml-8 text-xs font-bold text-muted">
                        {s.round.result} sts
                      </span>
                    ) : null}
                  </button>
                  {!s.fo ? (
                    <button
                      type="button"
                      onClick={() => toggleDone(s.round.round)}
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        done
                          ? "bg-celadon text-bone"
                          : "bg-elevated text-muted"
                      )}
                    >
                      {done ? "✓" : "○"}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
          {filteredAccessories.length > 0 ? (
            <div className="border-t border-line px-4 py-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
                {labels.accessories}
              </p>
              {filteredAccessories.map((acc) => (
                <div key={acc.title} className="mb-3">
                  <h4 className="font-display text-base text-ink">
                    {acc.title}
                  </h4>
                  <ul className="mt-1 space-y-1 text-sm text-muted">
                    {acc.steps.map((step, i) => (
                      <li key={`${acc.title}-${i}`}>• {step.instructions}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : viewMode === "focus" ? (
        <div>
          {steps.length > 0 ? (
            <div className="flex gap-1.5 overflow-x-auto border-b border-line px-3 py-2.5 sm:px-5">
              {steps.map((s) => {
                const on = s.index === safeFocus;
                const done = !s.fo && doneSet.has(s.round.round);
                return (
                  <button
                    key={`${s.round.round}-${s.index}`}
                    type="button"
                    onClick={() => selectStep(s.index)}
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
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
          ) : null}
          {current ? (
            <div className="border-b border-line p-4 sm:p-6">
              <InstructionCard
                current={current}
                stepLabel={stepLabel}
                safeFocus={safeFocus}
                stepsLength={steps.length}
                doneSet={doneSet}
                labels={labels}
                onToggle={() => toggleDone(current.round.round)}
                onPrev={() => go(-1)}
                onNext={() => go(1)}
                techniqueLibrary={techniqueLibrary}
              />
            </div>
          ) : null}
          <div className="space-y-4 p-3 sm:p-5">
            <VisualPanels
              piece={piece}
              mode={mode}
              labels={labels}
              activeRoundNumber={activeRoundNumber}
              onRoundChange={onDiagramRound}
            />
          </div>
        </div>
      ) : (
        /* Dashboard layout inside this piece */
        <div>
          <div className="flex gap-1 border-b border-line p-2 lg:hidden">
            {(
              [
                ["steps", labels.panelSteps],
                ["graph", labels.panelGraph],
                ["chart", labels.panelChart],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMobilePanel(id)}
                className={cn(
                  "flex-1 rounded-full px-2 py-2 text-xs font-bold transition",
                  mobilePanel === id
                    ? "bg-ink text-bone"
                    : "bg-elevated text-muted"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="lg:grid lg:grid-cols-[10.5rem_minmax(0,1.1fr)_minmax(0,0.95fr)] lg:items-stretch">
            <aside
              className={cn(
                "border-b border-line p-3 sm:p-4 lg:border-b-0 lg:border-r",
                mobilePanel !== "steps" && "hidden lg:block"
              )}
            >
              <RoundRail
                steps={steps}
                stepLabel={stepLabel}
                focusIndex={safeFocus}
                doneSet={doneSet}
                onSelect={selectStep}
                title={labels.roundsNav}
              />
            </aside>

            <div
              className={cn(
                "space-y-4 border-b border-line p-3 sm:p-5 lg:border-b-0 lg:border-r",
                mobilePanel !== "steps" && "hidden lg:block"
              )}
            >
              {current ? (
                <InstructionCard
                  current={current}
                  stepLabel={stepLabel}
                  safeFocus={safeFocus}
                  stepsLength={steps.length}
                  doneSet={doneSet}
                  labels={labels}
                  onToggle={() => toggleDone(current.round.round)}
                  onPrev={() => go(-1)}
                  onNext={() => go(1)}
                  compact
                  techniqueLibrary={techniqueLibrary}
                />
              ) : null}

              <div className="space-y-2">
                {steps.map((s) => {
                  const on = s.index === safeFocus;
                  const done = !s.fo && doneSet.has(s.round.round);
                  const anchor = roundAnchor(piece.id, s.round.round, s.fo);
                  return (
                    <div
                      key={anchor}
                      id={anchor}
                      className={cn(
                        "flex gap-2 rounded-xl border px-3 py-2.5",
                        on
                          ? "border-apricot/45 bg-apricot/5"
                          : done
                            ? "border-celadon/25 bg-celadon/5"
                            : "border-line/70 bg-bg/60"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => selectStep(s.index)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span
                          className={cn(
                            "mr-2 font-display text-base",
                            on ? "text-apricot" : "text-gold"
                          )}
                        >
                          {s.fo ? "FO" : s.round.round}
                        </span>
                        <span className="text-sm text-ink">
                          {s.round.instructions}
                        </span>
                      </button>
                      {!s.fo ? (
                        <button
                          type="button"
                          onClick={() => toggleDone(s.round.round)}
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                            done
                              ? "bg-celadon text-bone"
                              : "bg-elevated text-muted"
                          )}
                        >
                          {done ? "✓" : "○"}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {filteredAccessories.length > 0 ? (
                <div className="rounded-xl border border-line bg-bg/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
                    {labels.accessories}
                  </p>
                  {filteredAccessories.map((acc) => (
                    <div key={acc.title} className="mt-2">
                      <p className="font-display text-sm text-ink">
                        {acc.title}
                      </p>
                      <ul className="mt-1 space-y-1 text-xs text-muted">
                        {acc.steps.map((step, i) => (
                          <li key={`${acc.title}-${i}`}>
                            • {step.instructions}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-3 p-3 sm:p-4">
              <div
                className={cn(mobilePanel !== "graph" && "hidden lg:block")}
              >
                <VisualPanels
                  piece={piece}
                  mode={mode}
                  labels={labels}
                  activeRoundNumber={activeRoundNumber}
                  onRoundChange={onDiagramRound}
                  showGraph
                  showChart={false}
                />
              </div>
              <div
                className={cn(mobilePanel !== "chart" && "hidden lg:block")}
              >
                <VisualPanels
                  piece={piece}
                  mode={mode}
                  labels={labels}
                  activeRoundNumber={activeRoundNumber}
                  onRoundChange={onDiagramRound}
                  showGraph={false}
                  showChart
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export function PatternStudioWorkspace({
  patternId,
  components,
  labels,
  techniqueLibrary,
}: {
  patternId: string;
  components: PatternComponent[];
  labels: StudioLabels;
  techniqueLibrary?: TechniquePublic[];
}) {
  const pieces = useMemo(
    () => components.filter((c) => !isRedundantNoteComponent(c)),
    [components]
  );

  const [viewMode, setViewMode] = useState<StudioViewMode>("dashboard");
  const [activePieceId, setActivePieceId] = useState(pieces[0]?.id || "");
  const [hashFocus, setHashFocus] = useState<{
    pieceId: string;
    stepIndex: number;
  } | null>(null);

  useEffect(() => {
    setViewMode(getStudioViewMode());
    return subscribeStudioPrefs(() => setViewMode(getStudioViewMode()));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const applyHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;
      const partMatch = hash.match(/^part-(.+)$/);
      if (partMatch && pieces.some((p) => p.id === partMatch[1])) {
        setActivePieceId(partMatch[1]);
        setHashFocus({ pieceId: partMatch[1], stepIndex: 0 });
        return;
      }
      const roundMatch = hash.match(/^r-(.+)-(\d+|fo)$/);
      if (roundMatch) {
        const [, cid, token] = roundMatch;
        const p = pieces.find((x) => x.id === cid);
        if (!p) return;
        setActivePieceId(cid);
        const steps = buildSteps(p);
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

  function changeMode(next: StudioViewMode) {
    setViewMode(next);
    setStudioViewMode(next);
  }

  const hint =
    viewMode === "focus" ? labels.focusHint : labels.modeHint;

  return (
    <section className="mt-12 sm:mt-16" id="instructions">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">
            {labels.instructions}
          </h2>
          <p className="mt-1 text-sm text-muted">{hint}</p>
        </div>
        <ModeSwitcher
          mode={viewMode}
          onChange={changeMode}
          labels={labels}
        />
      </div>

      <div className="mt-5">
        <PieceJumpNav pieces={pieces} activePieceId={activePieceId} />
      </div>

      {/* Every piece stacked: Head, Body, Belly… */}
      <div className="mt-5 space-y-6 sm:mt-6 sm:space-y-8">
        {pieces.map((piece, i) => (
          <StudioPieceBlock
            key={piece.id}
            patternId={patternId}
            piece={piece}
            pieceIndex={i}
            labels={labels}
            viewMode={viewMode}
            techniqueLibrary={techniqueLibrary}
            initialFocus={
              hashFocus?.pieceId === piece.id
                ? hashFocus.stepIndex
                : undefined
            }
            onActivate={() => setActivePieceId(piece.id)}
          />
        ))}
      </div>
    </section>
  );
}
