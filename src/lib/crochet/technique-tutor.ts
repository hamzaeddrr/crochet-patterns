import type { PatternRound, StitchOpType } from "@/types";
import { isFastenOffRound } from "@/lib/crochet/construction";
import { detectionRules } from "@/lib/crochet/technique-catalog";

/** Technique keys used by studio tips + /learn. */
export type TechniqueKey = string;

function hasOp(round: PatternRound, type: StitchOpType): boolean {
  return (round.operations || []).some((op) => {
    if (op.type === type) return true;
    if (op.type === "repeat" && op.of) {
      return op.of.some((inner) => inner.type === type);
    }
    return false;
  });
}

const CORE_ORDER = [
  "magic_ring",
  "chain",
  "slst",
  "sc",
  "hdc",
  "dc",
  "inc",
  "dec",
  "blo",
  "flo",
  "fo",
];

/** Detect which technique cards apply to this round (max 3). */
export function techniquesForRound(round: PatternRound): TechniqueKey[] {
  const found = new Set<TechniqueKey>();
  const instr = (round.instructions || "").toLowerCase();

  if (isFastenOffRound(round) || hasOp(round, "fasten_off")) {
    found.add("fo");
  }

  for (const rule of detectionRules()) {
    const opHit = rule.ops.some((op) => hasOp(round, op as StitchOpType));
    const textHit = rule.pattern ? rule.pattern.test(instr) : false;
    if (opHit || textHit) found.add(rule.key);
  }

  // Extra free-text detections for catalog keys without ops
  if (/\b(slip\s*knot)\b/i.test(instr)) found.add("slip_knot");
  if (/\b(blo)\b/i.test(instr)) found.add("blo");
  if (/\b(flo)\b/i.test(instr)) found.add("flo");
  if (/\b(bobble|puff|popcorn|crab|dc2tog|hdc2tog|tr2tog|dc3tog|weave|fsc|fhdc)\b/i.test(instr)) {
    if (/\bbobble\b/i.test(instr)) found.add("bobble");
    if (/\bpuff\b/i.test(instr)) found.add("puff");
    if (/\bpopcorn\b/i.test(instr)) found.add("popcorn");
    if (/\bcrab\b/i.test(instr)) found.add("crab");
    if (/\bdc2tog\b/i.test(instr)) found.add("dc2tog");
    if (/\bhdc2tog\b/i.test(instr)) found.add("hdc2tog");
    if (/\btr2tog\b/i.test(instr)) found.add("tr2tog");
    if (/\bdc3tog\b/i.test(instr)) found.add("dc3tog");
    if (/\bweave\b/i.test(instr)) found.add("weave_ends");
    if (/\bfsc\b/i.test(instr)) found.add("fsc");
    if (/\bfhdc\b/i.test(instr)) found.add("fhdc");
  }
  if (/\b(color\s*change|change\s*colou?r|new\s*ball)\b/i.test(instr)) {
    found.add("color_change");
  }

  const ordered = [
    ...CORE_ORDER.filter((k) => found.has(k)),
    ...[...found].filter((k) => !CORE_ORDER.includes(k)),
  ];
  return ordered.slice(0, 3);
}
