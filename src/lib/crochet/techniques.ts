import type { DesignSpec, PatternContent } from "@/types";
import {
  detectConstructionMode,
  isCrochetedComponent,
} from "@/lib/crochet/construction";

/** Derive maker-facing technique chips from design + ops (no new schema required). */
export function deriveTechniques(
  spec: DesignSpec,
  content: PatternContent
): string[] {
  const techs = new Set<string>();
  const construction = (spec.construction || "").toLowerCase();

  if (/amigurumi|in[- ]?the[- ]?round|circular/.test(construction)) {
    techs.add("Magic ring");
    techs.add("Worked in the round");
  }
  if (/flat|row/.test(construction)) {
    techs.add("Worked flat");
  }

  let hasInc = false;
  let hasDec = false;
  let hasTurn = false;
  let hasMr = false;
  let hasSew = false;

  for (const c of content.components || []) {
    if (detectConstructionMode(c) === "row") techs.add("Worked flat");
    if (isCrochetedComponent(c) && detectConstructionMode(c) === "round") {
      techs.add("Worked in the round");
    }
    for (const r of c.rounds || []) {
      const instr = (r.instructions || "").toLowerCase();
      for (const op of r.operations || []) {
        if (op.type === "magic_ring") hasMr = true;
        if (op.type === "inc") hasInc = true;
        if (op.type === "dec") hasDec = true;
        if (op.type === "turn") hasTurn = true;
      }
      if (/\b(mr|magic\s*ring)\b/.test(instr)) hasMr = true;
      if (/\binc\b/.test(instr)) hasInc = true;
      if (/\bdec\b|sc2tog/.test(instr)) hasDec = true;
      if (/\bturn\b/.test(instr)) hasTurn = true;
      if (/\bsew\b|\bassembl/.test(instr)) hasSew = true;
    }
  }

  if ((content.assembly || []).length) hasSew = true;

  if (hasMr) techs.add("Magic ring");
  if (hasInc) techs.add("Increases");
  if (hasDec) techs.add("Decreases");
  if (hasTurn) techs.add("Turning chains");
  if (hasSew) techs.add("Sewing / assembly");

  return [...techs].slice(0, 8);
}
