import type {
  PatternComponent,
  PatternContent,
  PatternRound,
  StitchOperation,
} from "@/types";
import { operationsHaveChartableSymbols } from "@/lib/crochet/stitch-symbols";

export type ConstructionMode = "round" | "row" | "note";

const ACCESSORY_RE =
  /\b(drawstring|hanging\s*loop|hang(?:ing)?\s*loop|for\s+(the\s+)?(loop|cord|tie|drawstring)|embroider|embroidery|safety\s*eyes?|pompom|tassel|cut\s+(cotton|fabric)|lining)\b/i;

const NON_STITCH_COMPONENT_RE =
  /\b(eye|embroider\w*|assembl\w*|closing|finish(?:ing)?|lining|fabric|pompom|tassel|note|drawstring|hanging\s*loop|cord)\b/i;

const STITCH_WORK_RE = /\b(sc|hdc|dc|tr|inc|dec|mr|magic\s*ring|sl\s*st|slip\s*st)\b/i;

/** Strip duplicated “make N” already present in the component name. */
export function cleanComponentDisplayName(
  name: string,
  make?: number
): { title: string; makeSuffix: string } {
  let title = name.trim();
  title = title.replace(/\s*[—–-]\s*make\s+\d+\s*$/i, "");
  title = title.replace(/\s*\(make\s+\d+\)\s*$/i, "");
  const makeSuffix = make && make > 1 ? ` · make ${make}` : "";
  if (/\bmake\s+\d+\s*$/i.test(title) && makeSuffix) {
    return { title, makeSuffix: "" };
  }
  return { title, makeSuffix };
}

export function isAssemblyInstruction(instructions: string): boolean {
  const instr = (instructions || "").trim();
  if (!instr) return false;
  return /\bassembl(e|y|ing)\b|\bsew together\b|\bclosing pieces\b|\battach (the )?(pieces|parts)\b|\bjoin (the )?(pieces|parts)\b/i.test(
    instr
  );
}

/** Pure chain used as drawstring / hanging loop / cord — not a stitch round. */
export function isPureChainAccessory(round: PatternRound): boolean {
  const instr = (round.instructions || "").trim();
  if (!instr) return false;

  const chMatch = instr.match(/\bch(?:ain)?\s+(\d+)\b/i);
  if (!chMatch) return false;
  const chainN = Number(chMatch[1]);

  // Foundation rows (ch + sc across) are real stitch work
  if (STITCH_WORK_RE.test(instr) && !ACCESSORY_RE.test(instr)) {
    return false;
  }

  if (ACCESSORY_RE.test(instr)) return true;

  // Chain-only line (optional FO/weave), often wrongly given result = chain length
  const stripped = instr
    .replace(/\s*\(\d+\)\s*$/g, "")
    .replace(/\bfasten\s*off\b/gi, "")
    .replace(/\bweave\b[^.]*/gi, "")
    .replace(/\bleave\b[^.]*/gi, "")
    .trim();
  const chainOnly = /^ch(?:ain)?\s+\d+(\s+for\s+[^.,;]+)?[.!,;]*$/i.test(
    stripped
  );
  if (
    chainOnly &&
    (round.result === 0 ||
      round.result === chainN ||
      round.result == null)
  ) {
    return true;
  }

  return false;
}

export function isAccessoryOrNoteRound(round: PatternRound): boolean {
  const instr = (round.instructions || "").trim();
  if (!instr) return round.result === 0;
  if (isAssemblyInstruction(instr)) return true;
  if (ACCESSORY_RE.test(instr)) return true;
  if (isPureChainAccessory(round)) return true;
  return false;
}

/** Title for a split-out accessory block (drawstring, hanging loop, etc.). */
export function accessorySectionTitle(instructions: string): string {
  const t = instructions.toLowerCase();
  if (/drawstring/.test(t)) return "Drawstring";
  if (/hanging\s*loop|hang\s*loop|for (the )?loop/.test(t)) return "Hanging loop";
  if (/cord|tie/.test(t) && /ch(?:ain)?\s+\d+/i.test(t)) return "Cord";
  if (/embroider|safety eyes?/.test(t)) return "Details";
  if (/pompom|tassel/.test(t)) return "Finishing piece";
  if (isAssemblyInstruction(instructions)) return "Assembly";
  return "Accessory";
}

/** Clean accessory instruction text for display (no fake stitch counts). */
export function formatAccessoryInstruction(instructions: string): string {
  let text = (instructions || "").trim();
  text = text.replace(/\s*\(\d+\)\s*$/g, "").trim();
  text = text.replace(/^(rnd|row|round|r)\s*\d+\s*[—–:\-]\s*/i, "").trim();
  const ch = text.match(/^ch(?:ain)?\s+(\d+)(?:\s+for\s+[^.,;]+)?/i);
  if (ch) {
    const rest = text
      .replace(/^ch(?:ain)?\s+\d+(?:\s+for\s+[^.,;]+)?[.,;]?\s*/i, "")
      .trim();
    const lead = `Ch ${ch[1]}`;
    return rest ? `${lead}. ${rest}` : lead;
  }
  return text;
}

export type RoundPartition = {
  main: PatternRound[];
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
  let sawMainFo = false;

  for (const round of rounds) {
    const postFoChain =
      sawMainFo &&
      !STITCH_WORK_RE.test(round.instructions || "") &&
      /\bch(?:ain)?\s+\d+/i.test(round.instructions || "");

    if (isAccessoryOrNoteRound(round) || postFoChain) {
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
        sawMainFo = true;
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
    if (isFastenOffRound(round)) {
      sawMainFo = true;
    }
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

export function chartAxisLastRound(rounds: PatternRound[]): number {
  const { main } = partitionComponentRounds(rounds);
  if (main.length) return main[main.length - 1].round;
  const bearing = stitchBearingRounds(rounds);
  return (
    bearing[bearing.length - 1]?.round ??
    rounds[rounds.length - 1]?.round ??
    1
  );
}

/** True when a component is only assembly/embroidery notes (skip in instructions tables). */
export function isRedundantNoteComponent(component: PatternComponent): boolean {
  const name = (component.name || "").toLowerCase();
  if (/\bassembl\w*|\bclosing\b/.test(name)) return true;

  const mode = detectConstructionMode(component);
  const rounds = component.rounds || [];
  if (
    rounds.length > 0 &&
    rounds.every(
      (r) =>
        isAssemblyInstruction(r.instructions || "") ||
        ((r.result === 0 || r.result == null) &&
          /\bassembl\w*|sew together|closing\b/i.test(r.instructions || ""))
    )
  ) {
    return true;
  }

  if (mode !== "note") return false;
  if (/\b(finish(?:ing)?)\b/.test(name)) return true;
  return rounds.every((r) =>
    /\bassembl\w*|sew together|closing\b/i.test(r.instructions || "")
  );
}

export function isDetailComponent(component: PatternComponent): boolean {
  if (isCrochetedComponent(component)) return false;
  if (isRedundantNoteComponent(component)) return false;
  return detectConstructionMode(component) === "note";
}

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

/** Shared overview: crocheted path vs details & finishing. */
export function getPatternOverview(
  components: PatternComponent[],
  opts: { hasAssembly: boolean; hasFinishing: boolean }
): {
  crocheted: PatternComponent[];
  details: PatternComponent[];
  detailLabels: string[];
} {
  const crocheted = components.filter(isCrochetedComponent);
  const details = components.filter(isDetailComponent);
  const detailLabels = overviewDetailLabels(components, opts.hasAssembly);
  if (opts.hasFinishing && !detailLabels.some((l) => /finish/i.test(l))) {
    detailLabels.push("Finishing");
  }
  return { crocheted, details, detailLabels };
}

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
  const instr = round.instructions || "";
  if (!/fasten\s*off|\bFO\b/i.test(instr)) return false;
  // "FO" alone or with weave — treat as FO even if result wrongly non-zero
  if (!STITCH_WORK_RE.test(instr)) return true;
  return round.result === 0;
}

export function stitchBearingRounds(rounds: PatternRound[]): PatternRound[] {
  const { main } = partitionComponentRounds(rounds);
  return main.filter((r) => {
    if (typeof r.result !== "number" || r.result <= 0) return false;
    if (isFastenOffRound(r)) return false;
    return true;
  });
}

export function diagramRounds(rounds: PatternRound[]): PatternRound[] {
  const { main } = partitionComponentRounds(rounds);
  return main.filter((r) => {
    if (operationsHaveChartableSymbols(r.operations)) return true;
    if (isFastenOffRound(r)) return true;
    return typeof r.result === "number" && r.result > 0;
  });
}

/**
 * Detect whether a component is worked in the round, in rows, or is a note/non-crochet block.
 */
export function detectConstructionMode(
  component: PatternComponent
): ConstructionMode {
  const name =
    `${component.construction || ""} ${component.name || ""}`.toLowerCase();

  if (NON_STITCH_COMPONENT_RE.test(name) && !hasCrochetWork(component)) {
    return "note";
  }

  // Component that only has accessory/assembly rounds → note
  const rounds = component.rounds || [];
  if (
    rounds.length > 0 &&
    rounds.every(
      (r) => isAccessoryOrNoteRound(r) || isFastenOffRound(r)
    ) &&
    !rounds.some(
      (r) =>
        typeof r.result === "number" &&
        r.result > 0 &&
        !isAccessoryOrNoteRound(r)
    )
  ) {
    if (!hasCrochetWork(component)) return "note";
  }

  const { main } = partitionComponentRounds(rounds);
  const first = main[0] || rounds[0];
  const firstOps = first?.operations || [];
  const firstInstr = (first?.instructions || "").toLowerCase();

  const hasMr =
    firstOps.some((o) => o.type === "magic_ring") ||
    /\b(mr|magic\s*ring)\b/.test(firstInstr);

  if (hasMr) return "round";

  const turnCount = main.filter(
    (r) =>
      (r.operations || []).some((o) => o.type === "turn") ||
      /\bturn\b/.test(r.instructions || "")
  ).length;

  const acrossCount = main.filter((r) =>
    /\bacross\b|foundation\s*ch|foundation\s*row|ch\s+\d+.+\bsc\b/i.test(
      r.instructions || ""
    )
  ).length;

  if (turnCount > 0 || acrossCount > 0) return "row";

  // Explicit construction string
  if (/flat|row/.test(component.construction || "") && !hasMr) return "row";
  if (/amigurumi|in[- ]?the[- ]?round|circular/.test(component.construction || "")) {
    return "round";
  }

  if (
    /flat|panel|strap|gusset|flap|row|strip|mask|beak|tuft|wing|ear\b/i.test(
      name
    ) &&
    !hasMr
  ) {
    return "row";
  }

  if (/amigurumi|in[- ]?the[- ]?round|circular/.test(name)) return "round";

  const scAround = main.filter((r) =>
    /^(\(?sc|\(?inc|\(?dec|sc\s+\d+|inc\s*x|dec\s*x)/i.test(
      (r.instructions || "").trim()
    )
  ).length;
  if (scAround >= Math.max(1, main.length - 2) && main.length > 0) {
    return "round";
  }

  return "round";
}

function hasCrochetWork(component: PatternComponent): boolean {
  const { main } = partitionComponentRounds(component.rounds || []);
  return main.some(
    (r) =>
      (operationsHaveChartableSymbols(r.operations) &&
        !isAccessoryOrNoteRound(r)) ||
      (typeof r.result === "number" &&
        r.result > 0 &&
        !isAccessoryOrNoteRound(r))
  );
}

export function isCrochetedComponent(component: PatternComponent): boolean {
  return (
    detectConstructionMode(component) !== "note" && hasCrochetWork(component)
  );
}

export function stepLabelForMode(
  mode: ConstructionMode
): "Rnd" | "Row" | "Step" {
  if (mode === "row") return "Row";
  if (mode === "note") return "Step";
  return "Rnd";
}

/**
 * Normalize rounds for display/storage:
 * - accessory chain ops (drawstring / hanging loop) get result 0
 * - assembly instructions zeroed / classified
 */
export function normalizeComponentRounds(
  component: PatternComponent
): PatternComponent {
  const { title } = cleanComponentDisplayName(component.name, component.make);
  let sawFo = false;
  const rounds = (component.rounds || []).map((round) => {
    const postFoChain =
      sawFo &&
      !STITCH_WORK_RE.test(round.instructions || "") &&
      /\bch(?:ain)?\s+\d+/i.test(round.instructions || "");

    if (isAccessoryOrNoteRound(round) || postFoChain) {
      const ops: StitchOperation[] = [
        { type: "text", text: round.instructions },
      ];
      return { ...round, result: 0, operations: ops };
    }

    if (isFastenOffRound(round)) {
      sawFo = true;
      return {
        ...round,
        result: 0,
        operations: [{ type: "fasten_off" as const }],
      };
    }

    if (
      typeof round.result === "number" &&
      round.result > 0
    ) {
      // track stitch work for FO sequencing in later rounds
    }
    return round;
  });

  // Detect mode after zeroing accessories
  const provisional = { ...component, name: title, rounds };
  const mode = detectConstructionMode(provisional);

  let construction = component.construction;
  if (mode === "round" && construction && /flat/i.test(construction)) {
    construction = "in-the-round";
  }
  if (
    mode === "row" &&
    (!construction || /amigurumi|round/i.test(construction))
  ) {
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

/**
 * Full content normalize: fix accessories, fold assembly stubs into assembly[],
 * keep crochet + detail components. Used on generate and on every read.
 */
export function normalizePatternContent(
  content: PatternContent
): PatternContent {
  const assemblyExtra: string[] = [];
  const existingAssembly = new Set(
    (content.assembly || []).map((s) => s.trim().toLowerCase())
  );

  const pushAssembly = (text: string) => {
    const t = formatAccessoryInstruction(text);
    if (!t) return;
    const key = t.toLowerCase();
    if (existingAssembly.has(key)) return;
    existingAssembly.add(key);
    assemblyExtra.push(t);
  };

  const components: PatternComponent[] = [];

  for (const raw of content.components || []) {
    const c = normalizeComponentRounds(raw);

    if (isRedundantNoteComponent(c)) {
      for (const r of c.rounds || []) {
        if ((r.instructions || "").trim()) pushAssembly(r.instructions);
      }
      if (c.notes?.trim()) pushAssembly(c.notes);
      continue;
    }

    const keptRounds: PatternRound[] = [];
    for (const r of c.rounds || []) {
      if (isAssemblyInstruction(r.instructions || "")) {
        pushAssembly(r.instructions);
        continue;
      }
      keptRounds.push(r);
    }

    components.push({ ...c, rounds: keptRounds });
  }

  return {
    ...content,
    components,
    assembly: [...(content.assembly || []), ...assemblyExtra],
  };
}
