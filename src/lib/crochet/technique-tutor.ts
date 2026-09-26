import type { PatternRound, StitchOpType } from "@/types";
import { isFastenOffRound } from "@/lib/crochet/construction";

/** Technique keys with visual beginner tutorials. */
export type TechniqueKey =
  | "magic_ring"
  | "sc"
  | "inc"
  | "dec"
  | "fo";

const ORDER: TechniqueKey[] = [
  "magic_ring",
  "sc",
  "inc",
  "dec",
  "fo",
];

function hasOp(round: PatternRound, type: StitchOpType): boolean {
  return (round.operations || []).some((op) => {
    if (op.type === type) return true;
    if (op.type === "repeat" && op.of) {
      return op.of.some((inner) => inner.type === type);
    }
    return false;
  });
}

/** Detect which beginner technique cards apply to this round. */
export function techniquesForRound(round: PatternRound): TechniqueKey[] {
  const found = new Set<TechniqueKey>();
  const instr = (round.instructions || "").toLowerCase();

  if (hasOp(round, "magic_ring") || /\b(mr|magic\s*ring)\b/.test(instr)) {
    found.add("magic_ring");
  }
  if (hasOp(round, "inc") || /\binc\b/.test(instr)) {
    found.add("inc");
  }
  if (hasOp(round, "dec") || /\bdec\b|sc2tog/.test(instr)) {
    found.add("dec");
  }
  if (isFastenOffRound(round) || hasOp(round, "fasten_off") || /\bfasten\s*off\b|\bfo\b/.test(instr)) {
    found.add("fo");
  }
  // sc tip when the round actually works single crochet (not only FO notes)
  if (
    !found.has("fo") &&
    (hasOp(round, "sc") || /\bsc\b/.test(instr))
  ) {
    found.add("sc");
  }

  return ORDER.filter((k) => found.has(k)).slice(0, 3);
}
