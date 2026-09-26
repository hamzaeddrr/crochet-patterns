import type { PatternComponent, PatternRound, StitchOperation } from "@/types";
import { operationsHaveChartableSymbols } from "@/lib/crochet/stitch-symbols";

export type ConstructionMode = "round" | "row" | "note";

const ACCESSORY_RE =
  /\b(drawstring|hanging loop|hang(ing)?\s*loop|embroider|embroidery|safety eyes?|pompom|tassel|cut (cotton|fabric)|lining)\b/i;

const NON_STITCH_COMPONENT_RE =
  /\b(eye|embroider\w*|assembl\w*|closing|finish(?:ing)?|lining|fabric|pompom|tassel|note)\b/i;

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
  // Assembly-only note rounds (not crochet)
  if (
    round.result === 0 &&
    /\bassembl(e|y)|sew together|closing pieces\b/i.test(instr)
  ) {
    return true;
  }
  if (round.result === 0 && /fasten\s*off|leave (a )?long tail|weave/i.test(instr)) {
    // pure FO closing — not a stitch-count datapoint, but still a step
    return false;
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

/** Title for a split-out accessory block (drawstring, hanging loop, etc.). */
export function accessorySectionTitle(instructions: string): string {
  const t = instructions.toLowerCase();
  if (/drawstring/.test(t)) return "Drawstring";
  if (/hanging\s*loop|hang\s*loop|for (the )?loop/.test(t)) return "Hanging loop";
  if (/embroider|safety eyes?/.test(t)) return "Details";
  if (/pompom|tassel/.test(t)) return "Finishing piece";
  return "Accessory";
}

/** Clean accessory instruction text for display (no fake stitch counts). */
export function formatAccessoryInstruction(instructions: string): string {
  let text = (instructions || "").trim();
  text = text.replace(/\s*\(\d+\)\s*$/g, "").trim();
  // Prefer a short lead for chain accessories
  const ch = text.match(/^ch(?:ain)?\s+(\d+)(?:\s+for\s+[^.,;]+)?/i);
  if (ch) {
    const rest = text.replace(/^ch(?:ain)?\s+\d+(?:\s+for\s+[^.,;]+)?[.,;]?\s*/i, "").trim();
    const lead = `Ch ${ch[1]}`;
    return rest ? `${lead}. ${rest}` : lead;
  }
  return text;
}

export type RoundPartition = {
  /** Stitch-bearing rounds + piece FO (before accessories). */
  main: PatternRound[];
  /** Split accessory blocks (drawstring, hanging loop, …). */
  accessories: { title: string; steps: PatternRound[] }[];
};

/**
 * Split a component's rounds into the crocheted piece vs accessory operations
 * (drawstring / hanging loop), so accessories are never shown as stitch-count rounds.
 */
export function partitionComponentRounds(
  rounds: PatternRound[]
): RoundPartition {
  const main: PatternRound[] = [];
  const accessories: { title: string; steps: PatternRound[] }[] = [];
  let currentAcc: { title: string; steps: PatternRound[] } | null = null;
  let sawStitch = false;

  for (const round of rounds) {
    if (isAccessoryOrNoteRound(round)) {
      // Close main with a synthetic FO if the piece had stitches but no FO yet
      if (
        sawStitch &&
        main.length &&
        !isFastenOffRound(main[main.length - 1]) &&
        !currentAcc
      ) {
        main.push({
          round: main[main.length - 1].round,
          instructions: "fasten off",
          result: 0,
          operations: [{ type: "fasten_off" }],
        });
      }
      const title = accessorySectionTitle(round.instructions || "");
      if (!currentAcc || currentAcc.title !== title) {
        currentAcc = { title, steps: [] };
        accessories.push(currentAcc);
      }
      currentAcc.steps.push({
        ...round,
        result: 0,
        instructions: formatAccessoryInstruction(round.instructions || ""),
      });
      continue;
    }

    // FO / weave that follows an accessory stays with that accessory
    if (
      currentAcc &&
      (isFastenOffRound(round) ||
        /\bweave\b|\bknot\b|\bsecure\b/i.test(round.instructions || ""))
    ) {
      currentAcc.steps.push({
        ...round,
        result: 0,
        instructions: formatAccessoryInstruction(round.instructions || ""),
      });
      continue;
    }

    currentAcc = null;
    if (
      typeof round.result === "number" &&
      round.result > 0 &&
      !isFastenOffRound(round)
    ) {
      sawStitch = true;
    }
    main.push(round);
  }

  return { main, accessories };
}

/** Last round/row number for chart axis (includes FO, excludes accessories). */
export function chartAxisLastRound(rounds: PatternRound[]): number {
  const { main } = partitionComponentRounds(rounds);
  if (main.length) return main[main.length - 1].round;
  const bearing = stitchBearingRounds(rounds);
  return bearing[bearing.length - 1]?.round ?? rounds[rounds.length - 1]?.round ?? 1;
}

/** True when a component is only assembly/embroidery notes (skip in PDF instructions). */
export function isRedundantNoteComponent(component: PatternComponent): boolean {
  const name = (component.name || "").toLowerCase();
  // Always skip dedicated assembly/closing stub components
  if (/\bassembl\w*|\bclosing\b/.test(name)) return true;

  const mode = detectConstructionMode(component);
  if (mode !== "note") {
    // Also skip if every round is assemble/sew with no stitch work
    const rounds = component.rounds || [];
    if (
      rounds.length > 0 &&
      rounds.every(
        (r) =>
          (r.result === 0 || r.result == null) &&
          /\bassembl\w*|sew together|closing\b/i.test(r.instructions || "")
      )
    ) {
      return true;
    }
    return false;
  }

  if (/\b(finish(?:ing)?)\b/.test(name)) return true;
  const onlyAssemble = (component.rounds || []).every((r) =>
    /\bassembl\w*|sew together|closing\b/i.test(r.instructions || "")
  );
  return onlyAssemble;
}

/** Non-crochet detail pieces shown under “Details & assembly” in overview. */
export function isDetailComponent(component: PatternComponent): boolean {
  if (isCrochetedComponent(component)) return false;
  if (isRedundantNoteComponent(component)) return false; // folded into “Assembly”
  return detectConstructionMode(component) === "note";
}

/** Labels for the overview “Details & assembly” list. */
export function overviewDetailLabels(
  components: PatternComponent[],
  hasAssemblySection: boolean
): string[] {
  const labels: string[] = [];
  for (const c of components) {
    if (!isDetailComponent(c)) continue;
    labels.push(cleanComponentDisplayName(c.name, c.make).title);
  }
  if (
    hasAssemblySection ||
    components.some((c) => isRedundantNoteComponent(c))
  ) {
    labels.push("Assembly");
  }
  return labels;
}

/** Format stitch-count chart summary in chronological order (not min→max). */
export function formatStitchCountSummary(counts: number[]): string {
  if (!counts.length) return "";
  if (counts.every((c) => c === counts[0])) return `${counts[0]} sts each`;
  if (counts.length <= 6) return `${counts.join(" → ")} sts`;
  const first = counts[0];
  const last = counts[counts.length - 1];
  const peak = Math.max(...counts);
  if (peak !== first && peak !== last) {
    return `${first} → ${peak} → ${last} sts`;
  }
  return `${first} → ${last} sts`;
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
