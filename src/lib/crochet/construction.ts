import type { PatternComponent, PatternRound, StitchOperation } from "@/types";
import { operationsHaveChartableSymbols } from "@/lib/crochet/stitch-symbols";

export type ConstructionMode = "round" | "row" | "note";

const ACCESSORY_RE =
  /\b(drawstring|hanging loop|hang(ing)?\s*loop|embroider|embroidery|safety eyes?|assemble|assembly|finishing|weave (in )?ends|cut (cotton|fabric)|pompom|tassel|insert|snap|lining)\b/i;

const NON_STITCH_COMPONENT_RE =
  /\b(eye|embroider|assembl|finish|lining|fabric|pompom|tassel|note)\b/i;

/** Strip duplicated “make N” already present in the component name. */
export function cleanComponentDisplayName(
  name: string,
  make?: number
): { title: string; makeSuffix: string } {
  let title = name.trim();
  // Remove trailing "— make 2" / "- make 2" / "make 2" duplicates
  title = title.replace(
    /\s*[—–-]\s*make\s+\d+\s*$/i,
    ""
  );
  title = title.replace(/\s*\(make\s+\d+\)\s*$/i, "");
  const makeSuffix =
    make && make > 1 ? ` · make ${make}` : "";
  // If name still ends with make N and makeSuffix would duplicate, clear suffix when already in title
  if (/\bmake\s+\d+\s*$/i.test(title) && makeSuffix) {
    return { title, makeSuffix: "" };
  }
  return { title, makeSuffix };
}

export function isAccessoryOrNoteRound(round: PatternRound): boolean {
  const instr = (round.instructions || "").trim();
  if (!instr) return round.result === 0;
  if (ACCESSORY_RE.test(instr)) return true;
  if (round.result === 0 && /fasten\s*off|leave (a )?long tail|weave/i.test(instr)) {
    // pure FO closing — not a stitch-count datapoint, but still a step
    return false; // keep as FO step, handled separately
  }
  // Chain-only "for drawstring/loop" counted as inflated result
  if (
    /ch(ain)?\s+\d+/i.test(instr) &&
    /(drawstring|hanging loop|hang\s*loop|for (the )?loop)/i.test(instr)
  ) {
    return true;
  }
  return false;
}

export function isFastenOffRound(round: PatternRound): boolean {
  const ops = round.operations || [];
  if (ops.some((o) => o.type === "fasten_off")) return true;
  return /fasten\s*off/i.test(round.instructions || "") && round.result === 0;
}

/** Rounds that belong on the stitch-count graph (true stitch progression). */
export function stitchBearingRounds(rounds: PatternRound[]): PatternRound[] {
  return rounds.filter((r) => {
    if (typeof r.result !== "number" || r.result <= 0) return false;
    if (isAccessoryOrNoteRound(r)) return false;
    if (isFastenOffRound(r)) return false;
    return true;
  });
}

/** Rounds shown in the symbol diagram picker (stitch work + FO). */
export function diagramRounds(rounds: PatternRound[]): PatternRound[] {
  return rounds.filter((r) => {
    if (isAccessoryOrNoteRound(r)) return false;
    if (operationsHaveChartableSymbols(r.operations)) return true;
    if (isFastenOffRound(r)) return true;
    // Plain sc rounds sometimes only have text ops after repair — still show if result > 0
    return typeof r.result === "number" && r.result > 0;
  });
}

/**
 * Detect whether a component is worked in the round, in rows, or is a note/non-crochet block.
 */
export function detectConstructionMode(
  component: PatternComponent
): ConstructionMode {
  const name = `${component.construction || ""} ${component.name || ""}`.toLowerCase();

  if (NON_STITCH_COMPONENT_RE.test(name) && !hasCrochetWork(component)) {
    return "note";
  }

  const rounds = component.rounds || [];
  const first = rounds[0];
  const firstOps = first?.operations || [];
  const firstInstr = (first?.instructions || "").toLowerCase();

  const hasMr =
    firstOps.some((o) => o.type === "magic_ring") ||
    /\b(mr|magic\s*ring)\b/.test(firstInstr);

  // Magic ring ⇒ always circular / in the round
  if (hasMr) return "round";

  const turnCount = rounds.filter(
    (r) =>
      (r.operations || []).some((o) => o.type === "turn") ||
      /\bturn\b/.test(r.instructions || "")
  ).length;

  const acrossCount = rounds.filter((r) =>
    /\bacross\b|foundation\s*ch|foundation\s*row/.test(r.instructions || "")
  ).length;

  if (turnCount > 0 || acrossCount > 0) return "row";

  // Name hints only when ops don't contradict
  if (/flat|panel|strap|gusset|flap|row|strip|mask|beak/.test(name) && !hasMr) {
    return "row";
  }

  if (/amigurumi|in[- ]?the[- ]?round|circular/.test(name)) return "round";

  // Default: if most rounds look like sc-around without turn → round
  const scAround = rounds.filter((r) =>
    /^(\(?sc|\(?inc|\(?dec|sc\s+\d+|inc\s*x|dec\s*x)/i.test(
      (r.instructions || "").trim()
    )
  ).length;
  if (scAround >= Math.max(1, rounds.length - 2)) return "round";

  return "round";
}

function hasCrochetWork(component: PatternComponent): boolean {
  return (component.rounds || []).some(
    (r) =>
      operationsHaveChartableSymbols(r.operations) ||
      (typeof r.result === "number" && r.result > 0)
  );
}

export function isCrochetedComponent(component: PatternComponent): boolean {
  return detectConstructionMode(component) !== "note" && hasCrochetWork(component);
}

export function stepLabelForMode(mode: ConstructionMode): "Rnd" | "Row" | "Step" {
  if (mode === "row") return "Row";
  if (mode === "note") return "Step";
  return "Rnd";
}

/**
 * Normalize rounds for display/storage:
 * - accessory chain ops (drawstring / hanging loop) get result 0 and text classification
 * - keeps instruction text intact
 */
export function normalizeComponentRounds(
  component: PatternComponent
): PatternComponent {
  const mode = detectConstructionMode(component);
  const { title } = cleanComponentDisplayName(component.name, component.make);
  const rounds = (component.rounds || []).map((round) => {
    if (!isAccessoryOrNoteRound(round)) return round;
    // Don't pollute stitch counts with drawstring/loop chain lengths
    const ops: StitchOperation[] = [
      {
        type: "text",
        text: round.instructions,
      },
    ];
    return {
      ...round,
      result: 0,
      operations: ops,
    };
  });

  let construction = component.construction;
  if (mode === "round" && construction && /flat/i.test(construction)) {
    construction = "in-the-round";
  }
  if (mode === "row" && (!construction || /amigurumi|round/i.test(construction))) {
    construction = "flat";
  }
  if (mode === "note") {
    construction = construction || "note";
  }

  return { ...component, name: title, construction, rounds };
}

export function normalizePatternComponents(
  components: PatternComponent[]
): PatternComponent[] {
  return components.map(normalizeComponentRounds);
}
