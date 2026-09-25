import type { StitchOperation, StitchOpType } from "@/types";

/** Flattened chart token rendered as a crochet symbol. */
export type ChartSymbolKind =
  | "ch"
  | "slst"
  | "sc"
  | "hdc"
  | "dc"
  | "inc"
  | "dec"
  | "mr"
  | "skip"
  | "join"
  | "fo"
  | "blo"
  | "flo"
  | "turn"
  | "text";

export interface ChartSymbol {
  kind: ChartSymbolKind;
  /** How many times this exact symbol repeats in a run (for compact labels). */
  count?: number;
  label?: string;
}

const COUNTABLE: StitchOpType[] = [
  "magic_ring",
  "chain",
  "sc",
  "hdc",
  "dc",
  "slst",
  "inc",
  "dec",
  "repeat",
  "skip",
];

function pushMany(out: ChartSymbol[], kind: ChartSymbolKind, n: number) {
  const count = Math.max(1, Math.floor(n) || 1);
  for (let i = 0; i < count; i++) out.push({ kind });
}

function expandOne(op: StitchOperation, out: ChartSymbol[]) {
  switch (op.type) {
    case "magic_ring":
      out.push({ kind: "mr" });
      pushMany(out, "sc", op.stitches ?? 6);
      break;
    case "chain":
      pushMany(out, "ch", op.stitches ?? 1);
      break;
    case "sc":
      pushMany(out, "sc", op.stitches ?? 1);
      break;
    case "hdc":
      pushMany(out, "hdc", op.stitches ?? 1);
      break;
    case "dc":
      pushMany(out, "dc", op.stitches ?? 1);
      break;
    case "slst":
      pushMany(out, "slst", op.stitches ?? 1);
      break;
    case "inc":
      pushMany(out, "inc", op.repeat ?? op.stitches ?? 1);
      break;
    case "dec":
      pushMany(out, "dec", op.repeat ?? op.stitches ?? 1);
      break;
    case "skip":
      pushMany(out, "skip", op.stitches ?? 1);
      break;
    case "join":
      out.push({ kind: "join" });
      break;
    case "fasten_off":
      out.push({ kind: "fo" });
      break;
    case "blo":
      out.push({ kind: "blo" });
      break;
    case "flo":
      out.push({ kind: "flo" });
      break;
    case "turn":
      out.push({ kind: "turn" });
      break;
    case "text":
      out.push({ kind: "text", label: op.text?.slice(0, 24) || "…" });
      break;
    case "repeat": {
      const times = Math.max(1, op.repeat ?? 1);
      const children = op.of || [];
      for (let i = 0; i < times; i++) {
        for (const child of children) expandOne(child, out);
      }
      break;
    }
    default:
      break;
  }
}

/** Expand round operations into a drawable symbol list (written order). */
export function expandOperationsToSymbols(
  operations: StitchOperation[] | undefined
): ChartSymbol[] {
  const out: ChartSymbol[] = [];
  for (const op of operations || []) expandOne(op, out);
  return out;
}

export function operationsHaveChartableSymbols(
  operations: StitchOperation[] | undefined
): boolean {
  const ops = operations || [];
  if (!ops.length) return false;
  return ops.some((o) => COUNTABLE.includes(o.type));
}

/** Collapse identical consecutive symbols for compact linear legends. */
export function collapseSymbolRuns(symbols: ChartSymbol[]): ChartSymbol[] {
  const runs: ChartSymbol[] = [];
  for (const s of symbols) {
    const last = runs[runs.length - 1];
    if (
      last &&
      last.kind === s.kind &&
      last.kind !== "text" &&
      last.kind !== "mr" &&
      !last.label &&
      !s.label
    ) {
      last.count = (last.count || 1) + 1;
    } else {
      runs.push({ ...s, count: 1 });
    }
  }
  return runs;
}

export const SYMBOL_LABELS: Record<ChartSymbolKind, string> = {
  ch: "ch",
  slst: "sl st",
  sc: "sc",
  hdc: "hdc",
  dc: "dc",
  inc: "inc",
  dec: "dec",
  mr: "MR",
  skip: "sk",
  join: "join",
  fo: "FO",
  blo: "BLO",
  flo: "FLO",
  turn: "turn",
  text: "note",
};
