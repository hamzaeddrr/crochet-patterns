import type {
  PatternComponent,
  PatternRound,
  StitchOperation,
  ValidationIssue,
  ValidationResult,
} from "@/types";

function opDelta(op: StitchOperation): number | null {
  switch (op.type) {
    case "magic_ring":
      return op.stitches ?? 6;
    case "chain":
      return op.stitches ?? 0;
    case "sc":
    case "hdc":
    case "dc":
    case "slst":
      return op.stitches ?? 1;
    case "inc":
      return (op.repeat ?? 1) * 1;
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

/** Estimate stitch count change from operations when AI provides ops. */
export function estimateRoundResult(
  previousCount: number,
  operations: StitchOperation[]
): number | null {
  if (!operations.length) return null;

  // Classic amigurumi: magic ring starts absolute count
  if (operations.some((o) => o.type === "magic_ring")) {
    let total = 0;
    for (const op of operations) {
      const d = opDelta(op);
      if (d === null) return null;
      total += d;
    }
    return total;
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

  // Inc/dec style: result = previous + net change from inc/dec,
  // while sc stitches often replace stitches 1:1.
  // Prefer AI-declared result; this is a secondary check.
  const hasIncDec = operations.some(
    (o) => o.type === "inc" || o.type === "dec" || o.type === "repeat"
  );
  if (hasIncDec) {
    // Parse common pattern: (sc, inc) x N → +N from previous
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

  return previousCount > 0 ? previousCount : delta;
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

    const expected = estimateRoundResult(prev, round.operations || []);
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

/** Human-readable US crochet line from a round (fallback display). */
export function formatRoundLine(round: PatternRound): string {
  if (round.instructions?.trim()) return round.instructions.trim();
  return `Round ${round.round}`;
}
