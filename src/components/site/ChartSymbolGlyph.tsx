import type { ReactNode } from "react";
import type { ChartSymbolKind } from "@/lib/crochet/stitch-symbols";

const INK = "#2b2522";

/** Standard crochet chart glyphs used on /learn and pattern diagrams. */
export function ChartSymbolGlyph({
  kind,
  size = 28,
  color = INK,
  className,
}: {
  kind: ChartSymbolKind;
  size?: number;
  color?: string;
  className?: string;
}) {
  const s = size;
  const common = {
    stroke: color,
    strokeWidth: 1.6,
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  let body: ReactNode;
  switch (kind) {
    case "ch":
      body = <ellipse cx="12" cy="12" rx="7" ry="4.5" {...common} />;
      break;
    case "slst":
      body = (
        <ellipse cx="12" cy="12" rx="5" ry="3.2" fill={color} stroke="none" />
      );
      break;
    case "sc":
      body = <path d="M7 7 L17 17 M17 7 L7 17" {...common} />;
      break;
    case "hdc":
      body = <path d="M12 4 V18 M7 5 H17" {...common} />;
      break;
    case "dc":
      body = <path d="M12 4 V18 M7 5 H17 M9 11 L15 8" {...common} />;
      break;
    case "inc":
      body = (
        <>
          <path d="M12 20 L6 8 M12 20 L18 8" {...common} />
          <path d="M4 6 L8 10 M8 6 L4 10" {...common} strokeWidth={1.4} />
          <path d="M16 6 L20 10 M20 6 L16 10" {...common} strokeWidth={1.4} />
        </>
      );
      break;
    case "dec":
      body = <path d="M6 6 L12 18 L18 6" {...common} />;
      break;
    case "mr":
      body = (
        <>
          <circle cx="12" cy="12" r="7" {...common} />
          <circle cx="12" cy="12" r="2.2" fill={color} stroke="none" />
        </>
      );
      break;
    case "skip":
      body = <path d="M6 12 H18" {...common} strokeDasharray="2 2.5" />;
      break;
    case "join":
      body = (
        <>
          <path d="M7 12 H17 M12 7 V17" {...common} />
          <circle cx="12" cy="12" r="6" {...common} />
        </>
      );
      break;
    case "fo":
      body = (
        <>
          <path d="M6 6 L18 18 M18 6 L6 18" {...common} />
          <circle cx="12" cy="12" r="8" {...common} opacity={0.35} />
        </>
      );
      break;
    case "blo":
    case "flo":
      body = (
        <>
          <path d="M5 14 Q12 6 19 14" {...common} />
          <path
            d="M5 17 Q12 10 19 17"
            {...common}
            opacity={kind === "blo" ? 0.35 : 1}
          />
        </>
      );
      break;
    case "turn":
      body = (
        <>
          <path d="M7 16 H15 A4 4 0 0 0 15 8 H11" {...common} />
          <path d="M11 5 L8 8 L11 11" {...common} />
        </>
      );
      break;
    default:
      body = (
        <rect
          x="5"
          y="7"
          width="14"
          height="10"
          rx="2"
          {...common}
          fill="rgba(217,107,82,0.08)"
        />
      );
  }

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
    >
      {body}
    </svg>
  );
}

/** Map technique studio keys → chart symbol kinds when known. */
export function chartKindForTechniqueKey(
  key: string
): ChartSymbolKind | undefined {
  const k = key.toLowerCase().replace(/-/g, "_");
  const map: Record<string, ChartSymbolKind> = {
    chain: "ch",
    ch: "ch",
    slip_knot: "ch",
    slst: "slst",
    slip_stitch: "slst",
    sc: "sc",
    single_crochet: "sc",
    hdc: "hdc",
    half_double_crochet: "hdc",
    dc: "dc",
    double_crochet: "dc",
    inc: "inc",
    increase: "inc",
    dec: "dec",
    decrease: "dec",
    magic_ring: "mr",
    mr: "mr",
    fo: "fo",
    fasten_off: "fo",
    blo: "blo",
    flo: "flo",
    join_ring: "join",
    join: "join",
  };
  return map[k];
}
