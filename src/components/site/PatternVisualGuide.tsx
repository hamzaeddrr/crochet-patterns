import type { PatternComponent } from "@/types";
import {
  cleanComponentDisplayName,
  isCrochetedComponent,
  isDetailComponent,
  isFastenOffRound,
  stitchBearingRounds,
  stepLabelForMode,
  detectConstructionMode,
  chartAxisLastRound,
  formatStitchCountSummary,
  partitionComponentRounds,
} from "@/lib/crochet/construction";

const ACCENTS = [
  "#d96b52",
  "#8fa58b",
  "#c49a5a",
  "#6e655e",
  "#c4573f",
  "#a3b8a0",
];

export function PatternMakePath({
  components,
  hasAssembly,
  hasFinishing,
  title,
  subtitle,
  jumpLabel,
  assembleLabel,
  finishLabel,
  crochetedLabel,
  detailsLabel,
  interactive,
}: {
  components: PatternComponent[];
  hasAssembly: boolean;
  hasFinishing: boolean;
  title: string;
  subtitle: string;
  jumpLabel: string;
  assembleLabel: string;
  finishLabel: string;
  crochetedLabel: string;
  detailsLabel: string;
  interactive: boolean;
}) {
  const crocheted = components.filter(isCrochetedComponent);
  const details = components.filter(isDetailComponent);

  const crochetSteps = crocheted.map((c) => {
    const { title: name } = cleanComponentDisplayName(c.name, c.make);
    const mode = detectConstructionMode(c);
    const step = stepLabelForMode(mode);
    const { main } = partitionComponentRounds(c.rounds || []);
    const last =
      main[main.length - 1]?.round ??
      c.rounds[c.rounds.length - 1]?.round ??
      c.rounds.length;
    return {
      id: c.id,
      label: name,
      meta:
        main.length > 0
          ? `${step}1–${last}${c.make && c.make > 1 ? ` · ×${c.make}` : ""}`
          : c.make && c.make > 1
            ? `×${c.make}`
            : undefined,
      href: interactive ? `#part-${c.id}` : undefined,
    };
  });

  const detailSteps: {
    id: string;
    label: string;
    meta?: string;
    href?: string;
  }[] = details.map((c) => {
    const { title: name } = cleanComponentDisplayName(c.name, c.make);
    return {
      id: c.id,
      label: name,
      href: interactive ? `#part-${c.id}` : undefined,
    };
  });

  if (hasAssembly) {
    detailSteps.push({
      id: "assembly",
      label: assembleLabel,
      href: interactive ? "#assembly" : undefined,
    });
  }
  if (hasFinishing) {
    detailSteps.push({
      id: "finishing",
      label: finishLabel,
      href: interactive ? "#finishing" : undefined,
    });
  }

  function renderStrip(
    steps: { id: string; label: string; meta?: string; href?: string }[]
  ) {
    return (
      <ol className="flex min-w-max items-stretch gap-0">
        {steps.map((step, i) => {
          const color = ACCENTS[i % ACCENTS.length];
          const inner = (
            <>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-bone"
                style={{ background: color }}
              >
                {i + 1}
              </span>
              <span className="mt-2 max-w-[7.5rem] text-center font-display text-sm leading-snug text-ink">
                {step.label}
              </span>
              {step.meta ? (
                <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                  {step.meta}
                </span>
              ) : null}
            </>
          );
          return (
            <li key={step.id} className="flex items-center">
              {step.href ? (
                <a
                  href={step.href}
                  className="flex w-[8.25rem] flex-col items-center rounded-2xl px-2 py-2 transition hover:bg-elevated/80"
                >
                  {inner}
                </a>
              ) : (
                <div className="flex w-[8.25rem] flex-col items-center px-2 py-2">
                  {inner}
                </div>
              )}
              {i < steps.length - 1 ? (
                <span
                  aria-hidden
                  className="mx-0.5 mb-6 h-px w-6 shrink-0 bg-line sm:w-8"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-line bg-[#fffdf9]">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
          {jumpLabel}
        </p>
        <h2 className="mt-1 font-display text-2xl text-ink sm:text-3xl">
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>
      </div>

      {crochetSteps.length > 0 && (
        <div className="border-b border-line px-4 py-5 sm:px-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
            {crochetedLabel}
          </p>
          <div className="overflow-x-auto">{renderStrip(crochetSteps)}</div>
        </div>
      )}

      {detailSteps.length > 0 && (
        <div className="px-4 py-5 sm:px-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
            {detailsLabel}
          </p>
          <div className="overflow-x-auto">{renderStrip(detailSteps)}</div>
        </div>
      )}
    </section>
  );
}

export function PatternPartsDiagram({
  components,
  objectLabel,
  title,
  subtitle,
  finishedLabel,
  interactive,
}: {
  components: PatternComponent[];
  objectLabel: string;
  title: string;
  subtitle: string;
  finishedLabel: string;
  interactive: boolean;
}) {
  const parts = components.filter(isCrochetedComponent);
  const n = Math.max(parts.length, 1);
  const cx = 200;
  const cy = 200;
  const orbit = 118;
  const labelR = 168;

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-line bg-[#fffdf9]">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <h2 className="font-display text-2xl text-ink sm:text-3xl">{title}</h2>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>

      {/* Diagram full-width so it stays readable */}
      <div className="border-b border-line bg-[radial-gradient(ellipse_at_50%_40%,rgba(217,107,82,0.12),transparent_55%),radial-gradient(ellipse_at_80%_80%,rgba(143,165,139,0.18),transparent_50%),#f3ebe0] px-3 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto w-full max-w-lg">
          <svg
            viewBox="0 0 400 400"
            className="h-auto w-full"
            role="img"
            aria-label={title}
          >
            <circle
              cx={cx}
              cy={cy}
              r={72}
              fill="#faf7f2"
              stroke="#d96b52"
              strokeWidth="3"
            />
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              className="fill-ink"
              style={{ fontSize: 15, fontWeight: 700 }}
            >
              {finishedLabel}
            </text>
            <text
              x={cx}
              y={cy + 16}
              textAnchor="middle"
              style={{ fontSize: 12, fill: "#6e655e" }}
            >
              {objectLabel.length > 24
                ? `${objectLabel.slice(0, 22)}…`
                : objectLabel}
            </text>

            {parts.map((part, i) => {
              const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
              const px = cx + Math.cos(angle) * orbit;
              const py = cy + Math.sin(angle) * orbit;
              const lx = cx + Math.cos(angle) * labelR;
              const ly = cy + Math.sin(angle) * labelR;
              const color = ACCENTS[i % ACCENTS.length];
              const { title: partTitle } = cleanComponentDisplayName(
                part.name,
                part.make
              );
              const short =
                partTitle.length > 16
                  ? `${partTitle.slice(0, 14)}…`
                  : partTitle;
              return (
                <g key={part.id}>
                  <line
                    x1={cx + Math.cos(angle) * 72}
                    y1={cy + Math.sin(angle) * 72}
                    x2={px}
                    y2={py}
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray="5 4"
                    opacity="0.75"
                  />
                  <circle cx={px} cy={py} r="22" fill={color} opacity="0.95" />
                  <text
                    x={px}
                    y={py + 5}
                    textAnchor="middle"
                    fill="#fffaf7"
                    style={{ fontSize: 13, fontWeight: 700 }}
                  >
                    {i + 1}
                  </text>
                  <text
                    x={lx}
                    y={ly + 4}
                    textAnchor="middle"
                    style={{ fontSize: 12, fontWeight: 600, fill: "#2b2522" }}
                  >
                    {short}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <ul className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">
        {parts.map((part, i) => {
          const color = ACCENTS[i % ACCENTS.length];
          const { title: partTitle, makeSuffix } = cleanComponentDisplayName(
            part.name,
            part.make
          );
          const mode = detectConstructionMode(part);
          const step = stepLabelForMode(mode);
          const { main } = partitionComponentRounds(part.rounds || []);
          const stitchRounds = main.filter((r) => !isFastenOffRound(r)).length;
          const content = (
            <>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-bone"
                style={{ background: color }}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-ink">
                  {partTitle}
                </span>
                <span className="text-xs text-muted">
                  {stitchRounds > 0
                    ? `${stitchRounds} ${step === "Row" ? "rows" : "rnds"}`
                    : part.construction}
                  {makeSuffix}
                </span>
              </span>
            </>
          );
          return (
            <li key={part.id}>
              {interactive ? (
                <a
                  href={`#part-${part.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-line/80 bg-bg/60 px-3 py-2.5 transition hover:border-apricot/40 hover:bg-elevated"
                >
                  {content}
                </a>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-line/80 bg-bg/60 px-3 py-2.5">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function PatternColorLegend({
  colors,
  title,
}: {
  colors: string[];
  title: string;
}) {
  if (!colors.length) return null;
  return (
    <div className="rounded-[1.35rem] border border-line bg-[#fffdf9] px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
        {title}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {colors.map((c) => (
          <li
            key={c}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-bg px-3 py-1.5 text-sm text-ink"
          >
            <span
              className="h-3.5 w-3.5 rounded-full border border-ink/10 shadow-sm"
              style={{ background: guessCssColor(c) }}
              aria-hidden
            />
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

function guessCssColor(name: string): string {
  const n = name.toLowerCase();
  const map: Record<string, string> = {
    navy: "#1e3a5f",
    blue: "#3b6ea5",
    teal: "#4a9b8c",
    cream: "#f5ead7",
    white: "#f7f4ef",
    ivory: "#f3ebe0",
    yellow: "#e6c35c",
    gold: "#c49a5a",
    pink: "#e8a0b0",
    coral: "#d96b52",
    apricot: "#d96b52",
    green: "#8fa58b",
    sage: "#8fa58b",
    mint: "#a3b8a0",
    red: "#c4573f",
    burgundy: "#7a2e2e",
    brown: "#6b4a35",
    beige: "#d9cbb8",
    grey: "#9a938a",
    gray: "#9a938a",
    black: "#2b2522",
    purple: "#7a6b8a",
    lavender: "#b7a7c9",
    orange: "#e0894a",
  };
  for (const [key, val] of Object.entries(map)) {
    if (n.includes(key)) return val;
  }
  return "#c4b8a8";
}

export function StitchCountChart({
  component,
  title,
  highlightRound,
}: {
  component: PatternComponent;
  title: string;
  highlightRound?: number;
}) {
  const mode = detectConstructionMode(component);
  if (mode === "note") return null;

  const points = stitchBearingRounds(component.rounds || []).map((r) => ({
    x: r.round,
    y: r.result,
  }));

  // Hide when there isn't a real stitch progression to chart
  if (points.length < 2) {
    return null;
  }

  const padX = 28;
  const padY = 22;
  const w = 320;
  const h = 120;
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));
  const minX = points[0].x;
  const maxX = Math.max(
    points[points.length - 1].x,
    chartAxisLastRound(component.rounds || [])
  );
  const isEven = minY === maxY;
  // Pad Y domain so an even line sits mid-chart (not stuck to the bottom)
  const yPad = isEven ? Math.max(4, Math.round(minY * 0.25)) : Math.max(2, Math.round((maxY - minY) * 0.2));
  const yMin = Math.max(0, minY - yPad);
  const yMax = maxY + yPad;
  const spanY = Math.max(yMax - yMin, 1);
  const spanX = Math.max(maxX - minX, 1);

  const coords = points.map((p) => {
    const x = padX + ((p.x - minX) / spanX) * (w - padX * 2);
    const y = h - padY - ((p.y - yMin) / spanY) * (h - padY * 2);
    return { ...p, px: x, py: y };
  });

  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.px.toFixed(1)} ${c.py.toFixed(1)}`)
    .join(" ");

  const area =
    path +
    ` L ${coords[coords.length - 1].px.toFixed(1)} ${(h - padY).toFixed(1)} L ${coords[0].px.toFixed(1)} ${(h - padY).toFixed(1)} Z`;

  const axisLabel = mode === "row" ? "Row" : "R";

  return (
    <div className="border-t border-line bg-elevated/40 px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          {title}
        </p>
        <p className="text-xs text-muted">
          {formatStitchCountSummary(points.map((p) => p.y))}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mt-1 h-auto w-full max-w-md"
        role="img"
        aria-label={title}
      >
        <path d={area} fill="rgba(217,107,82,0.12)" />
        <path
          d={path}
          fill="none"
          stroke="#d96b52"
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((c, i) => {
          const on = highlightRound === c.x;
          const labelEvery =
            points.length <= 8 ||
            i === 0 ||
            i === points.length - 1 ||
            i % 4 === 0 ||
            on;
          return (
            <g key={c.x}>
              {on ? (
                <circle
                  cx={c.px}
                  cy={c.py}
                  r="9"
                  fill="none"
                  stroke="#d96b52"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
              ) : null}
              <circle
                cx={c.px}
                cy={c.py}
                r={on ? 5 : 3.2}
                fill={on ? "#d96b52" : "#c4573f"}
              />
              {labelEvery ? (
                <text
                  x={c.px}
                  y={c.py - 8}
                  textAnchor="middle"
                  style={{
                    fontSize: 9,
                    fill: on ? "#d96b52" : "#6e655e",
                    fontWeight: 700,
                  }}
                >
                  {c.y}
                </text>
              ) : null}
            </g>
          );
        })}
        <text x={padX} y={h - 4} style={{ fontSize: 9, fill: "#9a938a" }}>
          {axisLabel}
          {minX}
        </text>
        <text
          x={w - padX}
          y={h - 4}
          textAnchor="end"
          style={{ fontSize: 9, fill: "#9a938a" }}
        >
          {axisLabel}
          {maxX}
        </text>
      </svg>
    </div>
  );
}
