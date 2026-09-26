import type {
  PatternComponent,
  PatternRound,
  StitchOperation,
  ValidationIssue,
  ValidationResult,
} from "@/types";
import { isAccessoryOrNoteRound } from "@/lib/crochet/construction";

function opDelta(op: StitchOperation): number | null {
  switch (op.type) {
    case "magic_ring":
      return op.stitches ?? 6;
    case "chain":
      // Foundation chains are not live stitches the same way; ignore for net count
      // unless this is the only op (handled elsewhere).
      return 0;
    case "sc":
    case "hdc":
    case "dc":
    case "slst":
      return op.stitches ?? 1;
    case "inc":
      // Each inc adds +1 stitch vs the stitch consumed
      return op.repeat ?? 1;
    case "dec":
      return -((op.repeat ?? 1) * 1);
    case "skip":
      return 0;
    case "repeat": {
      if (!op.of?.length || !op.repeat) return null;
      let inner = 0;
      for (const child of op.of) {
        const d = opDelta(child);
        if (d === null) return null;
        inner += d;
      }
      return inner * op.repeat;
    }
    case "join":
    case "fasten_off":
    case "blo":
    case "flo":
    case "turn":
    case "text":
      return 0;
    default:
      return null;
  }
}

function opsAreNonCountable(operations: StitchOperation[]): boolean {
  if (!operations.length) return true;
  return operations.every((o) =>
    ["text", "fasten_off", "join", "turn", "blo", "flo", "skip"].includes(
      o.type
    )
  );
}

function roundHasFastenOff(round: PatternRound): boolean {
  if (/fasten\s*off|\bFO\b/i.test(round.instructions || "")) return true;
  return (round.operations || []).some((o) => o.type === "fasten_off");
}

/** Estimate stitch count from operations when AI provides countable ops. */
export function estimateRoundResult(
  previousCount: number,
  operations: StitchOperation[]
): number | null {
  if (!operations.length || opsAreNonCountable(operations)) return null;

  if (operations.some((o) => o.type === "magic_ring")) {
    let total = 0;
    for (const op of operations) {
      const d = opDelta(op);
      if (d === null) return null;
      total += d;
    }
    return total;
  }

  // Foundation: chain then work across — prefer sc/hdc/dc totals, ignore chain length
  const hasChain = operations.some((o) => o.type === "chain");
  const workOps = operations.filter((o) => o.type !== "chain");
  if (hasChain && workOps.length) {
    let total = 0;
    let known = false;
    for (const op of workOps) {
      if (op.type === "magic_ring") continue;
      if (["sc", "hdc", "dc", "slst"].includes(op.type)) {
        total += op.stitches ?? 1;
        known = true;
      } else if (op.type === "inc") {
        total += (op.repeat ?? 1) * 2; // 2 stitches made
        known = true;
      } else if (op.type === "repeat") {
        const d = opDelta(op);
        if (d === null) return null;
        total += d;
        known = true;
      }
    }
    if (known) return total;
  }

  let delta = 0;
  let known = false;
  for (const op of operations) {
    const d = opDelta(op);
    if (d === null) continue;
    known = true;
    delta += d;
  }
  if (!known) return null;

  const hasIncDec = operations.some(
    (o) => o.type === "inc" || o.type === "dec" || o.type === "repeat"
  );
  if (hasIncDec) {
    const repeatOp = operations.find((o) => o.type === "repeat");
    if (repeatOp?.of && repeatOp.repeat) {
      let netPer = 0;
      let consumes = 0;
      for (const child of repeatOp.of) {
        if (child.type === "inc") {
          netPer += 1;
          consumes += 1;
        } else if (child.type === "dec") {
          netPer -= 1;
          consumes += 2;
        } else if (
          child.type === "sc" ||
          child.type === "hdc" ||
          child.type === "dc"
        ) {
          consumes += child.stitches ?? 1;
        }
      }
      if (consumes > 0) {
        return previousCount + netPer * repeatOp.repeat;
      }
    }
    return previousCount + delta;
  }

  // Plain sc around: stitch count stays the same
  if (
    operations.every((o) =>
      ["sc", "hdc", "dc", "slst", "turn", "blo", "flo"].includes(o.type)
    )
  ) {
    return previousCount > 0 ? previousCount : delta;
  }

  return previousCount > 0 ? previousCount : delta;
}

/** Pull the last parenthetical count from instructions, e.g. "... (24)". */
export function parseResultFromInstructions(
  instructions: string
): number | null {
  const matches = [...instructions.matchAll(/\((\d+)\)/g)];
  if (!matches.length) return null;
  return Number(matches[matches.length - 1][1]);
}

function validateComponent(component: PatternComponent): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  let prev = 0;

  for (const round of component.rounds) {
    if (!round.instructions?.trim()) {
      issues.push({
        componentId: component.id,
        round: round.round,
        expected: null,
        actual: null,
        message: "Missing instructions text.",
      });
    }

    // Accessories / assembly / FO are not stitch-count datapoints
    if (isAccessoryOrNoteRound(round) || roundHasFastenOff(round)) {
      if (
        isAccessoryOrNoteRound(round) &&
        typeof round.result === "number" &&
        round.result > 0
      ) {
        issues.push({
          componentId: component.id,
          round: round.round,
          expected: 0,
          actual: round.result,
          message:
            "Non-stitch step (drawstring / loop / assembly) should have result 0, not a stitch count.",
        });
      }
      if (roundHasFastenOff(round)) prev = 0;
      continue;
    }

    if (typeof round.result !== "number" || round.result < 0) {
      issues.push({
        componentId: component.id,
        round: round.round,
        expected: null,
        actual: round.result ?? null,
        message: "Round is missing a numeric stitch count (result).",
      });
      continue;
    }

    const ops = round.operations || [];
    if (opsAreNonCountable(ops)) {
      prev = round.result;
      continue;
    }

    const expected = estimateRoundResult(prev, ops);
    if (expected !== null && expected !== round.result) {
      issues.push({
        componentId: component.id,
        round: round.round,
        expected,
        actual: round.result,
        message: `Stitch-count mismatch: operations suggest ${expected}, pattern says ${round.result}.`,
      });
    }

    prev = round.result;
  }

  return issues;
}

export function validatePatternComponents(
  components: PatternComponent[]
): ValidationResult {
  const issues = components.flatMap(validateComponent);
  return {
    ok: issues.length === 0,
    issues,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Auto-repair unreliable AI operations so validation matches maker-facing text.
 * Trusts instruction counts / declared result; neutralizes bad ops.
 */
export function repairPatternComponents(
  components: PatternComponent[]
): { components: PatternComponent[]; fixed: number } {
  let fixed = 0;

  const next = components.map((component) => {
    let prev = 0;
    let sawFo = false;
    const rounds = component.rounds.map((round) => {
      let result = round.result;
      const instr = round.instructions || "";

      const postFoChain =
        sawFo &&
        !/\b(sc|hdc|dc|inc|dec|mr|magic\s*ring)\b/i.test(instr) &&
        /\bch(?:ain)?\s+\d+/i.test(instr);

      if (isAccessoryOrNoteRound(round) || postFoChain) {
        fixed += typeof result === "number" && result > 0 ? 1 : 0;
        return {
          ...round,
          result: 0,
          operations: [{ type: "text" as const, text: instr }],
        };
      }

      const parsed = parseResultFromInstructions(instr);
      if (parsed !== null && parsed !== result) {
        result = parsed;
        fixed += 1;
      }

      if (roundHasFastenOff(round)) {
        sawFo = true;
        prev = 0;
        return {
          ...round,
          result: 0,
          operations: [{ type: "fasten_off" as const }],
        };
      }

      const ops = round.operations || [];
      const expected = estimateRoundResult(prev, ops);
      if (
        !opsAreNonCountable(ops) &&
        expected !== null &&
        typeof result === "number" &&
        expected !== result
      ) {
        fixed += 1;
        prev = result;
        return {
          ...round,
          result,
          operations: [
            {
              type: "text" as const,
              text: round.instructions,
            },
          ],
        };
      }

      prev = typeof result === "number" ? result : prev;
      return { ...round, result, operations: ops };
    });
    return { ...component, rounds };
  });

  return { components: next, fixed };
}

export function formatRoundLine(round: PatternRound): string {
  if (round.instructions?.trim()) return round.instructions.trim();
  return `Round ${round.round}`;
}
