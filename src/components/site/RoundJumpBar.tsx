"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  getCompletedRounds,
  toggleRoundComplete,
} from "@/lib/client/pattern-progress";

export type JumpChip = {
  componentId: string;
  round: number;
  label: string;
  anchor: string;
  fo?: boolean;
};

export function RoundJumpBar({
  chips,
  patternId,
  title,
  progressLabel,
}: {
  chips: JumpChip[];
  patternId: string;
  title: string;
  progressLabel: (done: number, total: number) => string;
}) {
  const [done, setDone] = useState(0);
  const [active, setActive] = useState(chips[0]?.anchor || "");

  const total = chips.filter((c) => !c.fo).length;

  useEffect(() => {
    const sync = () => {
      let n = 0;
      for (const c of chips) {
        if (c.fo) continue;
        if (getCompletedRounds(patternId, c.componentId).includes(c.round)) {
          n += 1;
        }
      }
      setDone(n);
    };
    sync();
    window.addEventListener("loopcraft:progress", sync);
    return () => window.removeEventListener("loopcraft:progress", sync);
  }, [chips, patternId]);

  useEffect(() => {
    if (!chips.length) return;
    const observers: IntersectionObserver[] = [];
    for (const chip of chips) {
      const el = document.getElementById(chip.anchor);
      if (!el) continue;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) setActive(chip.anchor);
        },
        { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, [chips]);

  if (!chips.length) return null;

  return (
    <div className="sticky top-[4.75rem] z-30 -mx-4 mb-6 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-[1.25rem] sm:border sm:px-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
          {title}
        </p>
        <p className="text-xs font-semibold text-muted">
          {progressLabel(done, total)}
        </p>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {chips.map((chip) => (
          <a
            key={chip.anchor}
            href={`#${chip.anchor}`}
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold transition",
              active === chip.anchor
                ? "bg-apricot text-bone"
                : "bg-elevated text-ink hover:bg-ink hover:text-bone"
            )}
          >
            {chip.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export function RoundDoneButton({
  patternId,
  componentId,
  round,
  markLabel,
  doneLabel,
}: {
  patternId: string;
  componentId: string;
  round: number;
  markLabel: string;
  doneLabel: string;
}) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(isRoundDone(patternId, componentId, round));
    const sync = () =>
      setDone(isRoundDone(patternId, componentId, round));
    window.addEventListener("loopcraft:progress", sync);
    return () => window.removeEventListener("loopcraft:progress", sync);
  }, [patternId, componentId, round]);

  return (
    <button
      type="button"
      onClick={() =>
        setDone(toggleRoundComplete(patternId, componentId, round))
      }
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-bold transition",
        done
          ? "bg-celadon/20 text-celadon"
          : "bg-elevated text-muted hover:text-ink"
      )}
      aria-pressed={done}
      title={done ? doneLabel : markLabel}
    >
      {done ? "✓" : "○"}
    </button>
  );
}

function isRoundDone(
  patternId: string,
  componentId: string,
  round: number
): boolean {
  return getCompletedRounds(patternId, componentId).includes(round);
}

export function buildJumpChips(
  items: {
    componentId: string;
    rounds: { round: number; fo?: boolean }[];
    stepLabel: string;
  }[]
): JumpChip[] {
  const chips: JumpChip[] = [];
  for (const item of items) {
    for (const r of item.rounds) {
      chips.push({
        componentId: item.componentId,
        round: r.round,
        fo: r.fo,
        label: r.fo ? "FO" : `${item.stepLabel}${r.round}`,
        anchor: roundAnchor(item.componentId, r.round, r.fo),
      });
    }
  }
  return chips;
}

export function roundAnchor(
  componentId: string,
  round: number,
  fo?: boolean
): string {
  return fo ? `r-${componentId}-fo` : `r-${componentId}-${round}`;
}

/** Hook-friendly list of completed round keys for styling rows. */
export function useCompletedMap(patternId: string, componentId: string) {
  const [rounds, setRounds] = useState<number[]>([]);
  useEffect(() => {
    const sync = () => setRounds(getCompletedRounds(patternId, componentId));
    sync();
    window.addEventListener("loopcraft:progress", sync);
    return () => window.removeEventListener("loopcraft:progress", sync);
  }, [patternId, componentId]);
  return useMemo(() => new Set(rounds), [rounds]);
}
