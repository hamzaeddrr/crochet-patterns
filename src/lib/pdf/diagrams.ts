import type { PDFPage, RGB } from "pdf-lib";
import { LineCapStyle } from "pdf-lib";
import type { PatternComponent } from "@/types";
import {
  collapseSymbolRuns,
  expandOperationsToSymbols,
  SYMBOL_LABELS,
  type ChartSymbol,
  type ChartSymbolKind,
} from "@/lib/crochet/stitch-symbols";
import {
  detectConstructionMode,
  diagramRounds,
  isCrochetedComponent,
  stitchBearingRounds,
  stepLabelForMode,
  cleanComponentDisplayName,
  chartAxisLastRound,
  formatStitchCountSummary,
} from "@/lib/crochet/construction";
import {
  ensureSpace,
  drawSpacer,
  type LayoutCtx,
} from "./layout";
import { PDF_PAGE, PDF_THEME, contentWidth } from "./theme";

const ACCENTS: RGB[] = [
  PDF_THEME.apricot,
  PDF_THEME.celadon,
  PDF_THEME.gold,
  PDF_THEME.apricotDeep,
  PDF_THEME.celadonBright,
  PDF_THEME.muted,
];

function line(
  page: PDFPage,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: RGB,
  thickness = 1.2
) {
  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness,
    color,
    lineCap: LineCapStyle.Round,
  });
}

/** Draw a standard crochet chart glyph centered at (cx, cy). */
export function drawSymbolGlyph(
  page: PDFPage,
  kind: ChartSymbolKind,
  cx: number,
  cy: number,
  size: number,
  color: RGB = PDF_THEME.ink
) {
  const s = size;
  const t = Math.max(0.9, s * 0.08);

  switch (kind) {
    case "ch":
      page.drawEllipse({
        x: cx,
        y: cy,
        xScale: s * 0.32,
        yScale: s * 0.2,
        borderColor: color,
        borderWidth: t,
      });
      break;
    case "slst":
      page.drawEllipse({
        x: cx,
        y: cy,
        xScale: s * 0.22,
        yScale: s * 0.14,
        color,
      });
      break;
    case "sc":
      line(page, cx - s * 0.28, cy + s * 0.28, cx + s * 0.28, cy - s * 0.28, color, t);
      line(page, cx + s * 0.28, cy + s * 0.28, cx - s * 0.28, cy - s * 0.28, color, t);
      break;
    case "hdc":
      line(page, cx, cy + s * 0.32, cx, cy - s * 0.32, color, t);
      line(page, cx - s * 0.28, cy + s * 0.28, cx + s * 0.28, cy + s * 0.28, color, t);
      break;
    case "dc":
      line(page, cx, cy + s * 0.32, cx, cy - s * 0.32, color, t);
      line(page, cx - s * 0.28, cy + s * 0.28, cx + s * 0.28, cy + s * 0.28, color, t);
      line(page, cx - s * 0.18, cy, cx + s * 0.18, cy + s * 0.14, color, t);
      break;
    case "inc":
      line(page, cx, cy - s * 0.32, cx - s * 0.28, cy + s * 0.28, color, t);
      line(page, cx, cy - s * 0.32, cx + s * 0.28, cy + s * 0.28, color, t);
      line(page, cx - s * 0.38, cy + s * 0.32, cx - s * 0.18, cy + s * 0.12, color, t * 0.9);
      line(page, cx - s * 0.18, cy + s * 0.32, cx - s * 0.38, cy + s * 0.12, color, t * 0.9);
      line(page, cx + s * 0.18, cy + s * 0.32, cx + s * 0.38, cy + s * 0.12, color, t * 0.9);
      line(page, cx + s * 0.38, cy + s * 0.32, cx + s * 0.18, cy + s * 0.12, color, t * 0.9);
      break;
    case "dec":
      line(page, cx - s * 0.28, cy + s * 0.28, cx, cy - s * 0.32, color, t);
      line(page, cx + s * 0.28, cy + s * 0.28, cx, cy - s * 0.32, color, t);
      break;
    case "mr":
      page.drawCircle({
        x: cx,
        y: cy,
        size: s * 0.3,
        borderColor: color,
        borderWidth: t,
      });
      page.drawCircle({
        x: cx,
        y: cy,
        size: s * 0.1,
        color,
      });
      break;
    case "skip":
      page.drawLine({
        start: { x: cx - s * 0.3, y: cy },
        end: { x: cx + s * 0.3, y: cy },
        thickness: t,
        color,
        dashArray: [2, 2],
      });
      break;
    case "join":
      page.drawCircle({
        x: cx,
        y: cy,
        size: s * 0.28,
        borderColor: color,
        borderWidth: t,
      });
      line(page, cx - s * 0.22, cy, cx + s * 0.22, cy, color, t);
      line(page, cx, cy - s * 0.22, cx, cy + s * 0.22, color, t);
      break;
    case "fo":
      page.drawCircle({
        x: cx,
        y: cy,
        size: s * 0.32,
        borderColor: color,
        borderWidth: t * 0.8,
        opacity: 0.35,
      });
      line(page, cx - s * 0.22, cy + s * 0.22, cx + s * 0.22, cy - s * 0.22, color, t);
      line(page, cx + s * 0.22, cy + s * 0.22, cx - s * 0.22, cy - s * 0.22, color, t);
      break;
    case "turn":
      line(page, cx - s * 0.22, cy - s * 0.2, cx + s * 0.12, cy - s * 0.2, color, t);
      line(page, cx + s * 0.12, cy - s * 0.2, cx + s * 0.12, cy + s * 0.18, color, t);
      line(page, cx + s * 0.12, cy + s * 0.18, cx - s * 0.08, cy + s * 0.18, color, t);
      line(page, cx - s * 0.02, cy + s * 0.3, cx - s * 0.18, cy + s * 0.18, color, t);
      line(page, cx - s * 0.02, cy + s * 0.06, cx - s * 0.18, cy + s * 0.18, color, t);
      break;
    default:
      page.drawRectangle({
        x: cx - s * 0.28,
        y: cy - s * 0.18,
        width: s * 0.56,
        height: s * 0.36,
        borderColor: color,
        borderWidth: t,
        color: PDF_THEME.elevated,
      });
  }
}

function drawableSymbols(symbols: ChartSymbol[]): ChartSymbol[] {
  return symbols.filter((s) => s.kind !== "text");
}

/** Stitch-count progression sparkline for a component. */
export function drawStitchCountChart(
  ctx: LayoutCtx,
  component: PatternComponent
): boolean {
  const points = stitchBearingRounds(component.rounds || []).map((r) => ({
    x: r.round,
    y: r.result,
  }));
  if (points.length < 2) return false;

  const mode = detectConstructionMode(component);
  const axis = mode === "row" ? "Row" : "R";
  const w = contentWidth();
  const h = 88;
  const padX = 28;
  const padY = 18;

  ensureSpace(ctx, h + 28);
  const boxY = ctx.y - h;

  ctx.page.drawRectangle({
    x: PDF_PAGE.margin,
    y: boxY,
    width: w,
    height: h + 16,
    color: PDF_THEME.elevated,
    borderColor: PDF_THEME.line,
    borderWidth: 0.6,
  });

  ctx.page.drawText(
    points.length <= 6 ? "Stitch count" : "Stitch count range",
    {
      x: PDF_PAGE.margin + 10,
      y: boxY + h + 2,
      size: 8,
      font: ctx.fonts.bodyBold,
      color: PDF_THEME.muted,
    }
  );

  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));
  const minX = points[0].x;
  // Axis end includes FO round (e.g. R15) even when FO isn't a stitch datapoint
  const maxX = Math.max(
    points[points.length - 1].x,
    chartAxisLastRound(component.rounds || [])
  );
  const isEven = minY === maxY;
  const yPad = isEven
    ? Math.max(4, Math.round(minY * 0.25))
    : Math.max(2, Math.round((maxY - minY) * 0.2));
  const yMin = Math.max(0, minY - yPad);
  const yMax = maxY + yPad;
  const spanY = Math.max(yMax - yMin, 1);
  const spanX = Math.max(maxX - minX, 1);

  const chartX = PDF_PAGE.margin + padX;
  const chartW = w - padX * 2;
  const chartBottom = boxY + padY;
  const chartH = h - padY - 8;

  const coords = points.map((p) => {
    const px = chartX + ((p.x - minX) / spanX) * chartW;
    const py = chartBottom + ((p.y - yMin) / spanY) * chartH;
    return { ...p, px, py };
  });

  // Area fill as stacked thin rects approx via triangles skipped — line + dots
  for (let i = 0; i < coords.length - 1; i++) {
    line(
      ctx.page,
      coords[i].px,
      coords[i].py,
      coords[i + 1].px,
      coords[i + 1].py,
      PDF_THEME.apricot,
      1.8
    );
  }

  for (const c of coords) {
    ctx.page.drawCircle({
      x: c.px,
      y: c.py,
      size: 2.4,
      color: PDF_THEME.apricotDeep,
    });
  }

  const rangeLabel = formatStitchCountSummary(points.map((p) => p.y));
  const rw = ctx.fonts.body.widthOfTextAtSize(rangeLabel, 8);
  ctx.page.drawText(rangeLabel, {
    x: PDF_PAGE.margin + w - 10 - rw,
    y: boxY + h + 2,
    size: 8,
    font: ctx.fonts.body,
    color: PDF_THEME.muted,
  });

  ctx.page.drawText(`${axis}${minX}`, {
    x: chartX,
    y: boxY + 4,
    size: 7,
    font: ctx.fonts.body,
    color: PDF_THEME.softMuted,
  });
  const endLabel = `${axis}${maxX}`;
  ctx.page.drawText(endLabel, {
    x: chartX + chartW - ctx.fonts.body.widthOfTextAtSize(endLabel, 7),
    y: boxY + 4,
    size: 7,
    font: ctx.fonts.body,
    color: PDF_THEME.softMuted,
  });

  ctx.y = boxY - 12;
  return true;
}

function pickDiagramRounds(component: PatternComponent) {
  const rounds = diagramRounds(component.rounds || []).filter((r) => {
    const syms = drawableSymbols(expandOperationsToSymbols(r.operations));
    return syms.length > 0;
  });
  if (rounds.length <= 4) return rounds;
  // First, ~33%, ~66%, last stitch-bearing-ish
  const idxs = [
    0,
    Math.floor((rounds.length - 1) / 3),
    Math.floor(((rounds.length - 1) * 2) / 3),
    rounds.length - 1,
  ];
  const uniq = [...new Set(idxs)];
  return uniq.map((i) => rounds[i]);
}

function drawCircularMini(
  page: PDFPage,
  fonts: LayoutCtx["fonts"],
  symbols: ChartSymbol[],
  cx: number,
  cy: number,
  radius: number,
  label: string,
  result: number
) {
  const drawable = symbols.filter((s) => s.kind !== "fo" && s.kind !== "text");
  const hasMr = drawable.some((s) => s.kind === "mr");
  let stitches = drawable.filter((s) => s.kind !== "mr");
  if (hasMr) stitches = stitches.filter((s) => s.kind !== "ch");

  page.drawCircle({
    x: cx,
    y: cy,
    size: radius + 10,
    color: PDF_THEME.boneDeep,
  });
  page.drawCircle({
    x: cx,
    y: cy,
    size: radius,
    borderColor: PDF_THEME.apricot,
    borderWidth: 0.7,
    borderDashArray: [2, 2.5],
  });

  if (hasMr) {
    drawSymbolGlyph(page, "mr", cx, cy, 14, PDF_THEME.apricot);
  } else {
    page.drawCircle({
      x: cx,
      y: cy,
      size: 4,
      color: PDF_THEME.apricot,
      opacity: 0.35,
    });
  }

  const n = Math.max(stitches.length, 1);
  const maxDraw = 36;
  const step = n > maxDraw ? Math.ceil(n / maxDraw) : 1;
  const shown = stitches.filter((_, i) => i % step === 0);

  shown.forEach((sym, i) => {
    const idx = i * step;
    const angle = -Math.PI / 2 + (idx / n) * Math.PI * 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    drawSymbolGlyph(page, sym.kind, x, y, 9, PDF_THEME.ink);
  });

  const caption =
    result > 0 ? `${label} · ${result}` : label;
  const cw = fonts.bodyBold.widthOfTextAtSize(caption, 7);
  page.drawText(caption, {
    x: cx - cw / 2,
    y: cy - radius - 14,
    size: 7,
    font: fonts.bodyBold,
    color: PDF_THEME.muted,
  });
}

function drawFlatMini(
  page: PDFPage,
  fonts: LayoutCtx["fonts"],
  symbols: ChartSymbol[],
  x: number,
  y: number,
  width: number,
  label: string,
  result: number
) {
  const runs = collapseSymbolRuns(
    symbols.filter((s) => s.kind !== "text" && s.kind !== "fo")
  );
  const h = 52;
  page.drawRectangle({
    x,
    y: y - h,
    width,
    height: h,
    color: PDF_THEME.boneDeep,
    borderColor: PDF_THEME.line,
    borderWidth: 0.5,
  });

  const caption =
    result > 0 ? `${label} · ${result} sts` : label;
  page.drawText(caption, {
    x: x + 6,
    y: y - 12,
    size: 7,
    font: fonts.bodyBold,
    color: PDF_THEME.muted,
  });

  let gx = x + 10;
  const gy = y - 32;
  for (const run of runs.slice(0, 6)) {
    const n = Math.min(run.count || 1, 6);
    for (let i = 0; i < n; i++) {
      if (gx > x + width - 14) break;
      drawSymbolGlyph(page, run.kind, gx, gy, 10);
      gx += 11;
    }
    const tag = `${SYMBOL_LABELS[run.kind]}×${run.count || 1}`;
    if (gx + fonts.body.widthOfTextAtSize(tag, 6) < x + width - 6) {
      page.drawText(tag, {
        x: gx + 2,
        y: gy - 10,
        size: 6,
        font: fonts.body,
        color: PDF_THEME.softMuted,
      });
    }
    gx += 28;
  }
}

/** Circular or row stitch diagrams for key rounds of a component. */
export function drawComponentStitchDiagrams(
  ctx: LayoutCtx,
  component: PatternComponent
): boolean {
  const mode = detectConstructionMode(component);
  if (mode === "note") return false;

  const rounds = pickDiagramRounds(component);
  if (!rounds.length) return false;

  const step = stepLabelForMode(mode);
  const flat = mode === "row";

  ensureSpace(ctx, flat ? 80 : 150);
  ctx.page.drawText(
    flat
      ? "Stitch diagrams (read left → right)"
      : "Stitch diagrams (read clockwise from top)",
    {
      x: PDF_PAGE.margin,
      y: ctx.y,
      size: 8,
      font: ctx.fonts.bodyBold,
      color: PDF_THEME.muted,
    }
  );
  ctx.y -= 14;

  if (flat) {
    const gap = 8;
    const cardW = (contentWidth() - gap) / 2;
    for (let i = 0; i < rounds.length; i++) {
      if (i % 2 === 0) ensureSpace(ctx, 64);
      const r = rounds[i];
      const symbols = drawableSymbols(
        expandOperationsToSymbols(r.operations)
      );
      const col = i % 2;
      const x = PDF_PAGE.margin + col * (cardW + gap);
      drawFlatMini(
        ctx.page,
        ctx.fonts,
        symbols,
        x,
        ctx.y,
        cardW,
        `${step} ${r.round}`,
        r.result
      );
      if (col === 1 || i === rounds.length - 1) {
        ctx.y -= 60;
      }
    }
  } else {
    const n = Math.min(rounds.length, 4);
    const cellW = contentWidth() / Math.min(n, 2);
    const radius = 38;

    // Row 1
    const row1 = rounds.slice(0, Math.min(2, n));
    ensureSpace(ctx, radius * 2 + 36);
    row1.forEach((r, i) => {
      const cx = PDF_PAGE.margin + cellW * i + cellW / 2;
      const cy = ctx.y - radius - 4;
      const symbols = drawableSymbols(
        expandOperationsToSymbols(r.operations)
      );
      drawCircularMini(
        ctx.page,
        ctx.fonts,
        symbols,
        cx,
        cy,
        radius,
        `${step} ${r.round}`,
        r.result
      );
    });
    ctx.y -= radius * 2 + 28;

    const row2 = rounds.slice(2, 4);
    if (row2.length) {
      ensureSpace(ctx, radius * 2 + 36);
      row2.forEach((r, i) => {
        const cx = PDF_PAGE.margin + cellW * i + cellW / 2;
        const cy = ctx.y - radius - 4;
        const symbols = drawableSymbols(
          expandOperationsToSymbols(r.operations)
        );
        drawCircularMini(
          ctx.page,
          ctx.fonts,
          symbols,
          cx,
          cy,
          radius,
          `${step} ${r.round}`,
          r.result
        );
      });
      ctx.y -= radius * 2 + 28;
    }
  }

  return true;
}

/** Compact legend of symbols used in a component (or global key). */
export function drawSymbolLegend(
  ctx: LayoutCtx,
  kinds: ChartSymbolKind[],
  title = "Symbol key"
): void {
  const unique = [...new Set(kinds.filter((k) => k !== "text"))];
  if (!unique.length) return;

  ensureSpace(ctx, 36);
  ctx.page.drawText(title, {
    x: PDF_PAGE.margin,
    y: ctx.y,
    size: 8,
    font: ctx.fonts.bodyBold,
    color: PDF_THEME.muted,
  });
  ctx.y -= 16;

  let x = PDF_PAGE.margin;
  const rowH = 18;
  for (const kind of unique) {
    const label = SYMBOL_LABELS[kind];
    const itemW = 52;
    if (x + itemW > PDF_PAGE.margin + contentWidth()) {
      x = PDF_PAGE.margin;
      ctx.y -= rowH;
      ensureSpace(ctx, rowH);
    }
    drawSymbolGlyph(ctx.page, kind, x + 6, ctx.y + 2, 11);
    ctx.page.drawText(label, {
      x: x + 16,
      y: ctx.y,
      size: 8,
      font: ctx.fonts.body,
      color: PDF_THEME.ink,
    });
    x += itemW;
  }
  ctx.y -= rowH + 4;
}

export function collectComponentSymbolKinds(
  component: PatternComponent
): ChartSymbolKind[] {
  const kinds: ChartSymbolKind[] = [];
  for (const r of component.rounds || []) {
    for (const s of expandOperationsToSymbols(r.operations)) {
      if (s.kind !== "text") kinds.push(s.kind);
    }
  }
  return kinds;
}

/** Visual make-path / crocheted components strip for overview. */
export function drawMakePathDiagram(
  ctx: LayoutCtx,
  components: PatternComponent[]
): void {
  const parts = components.filter(isCrochetedComponent);
  if (!parts.length) return;

  ensureSpace(ctx, 78);
  ctx.page.drawText("Crocheted components", {
    x: PDF_PAGE.margin,
    y: ctx.y,
    size: 8,
    font: ctx.fonts.bodyBold,
    color: PDF_THEME.muted,
  });
  ctx.y -= 8;

  const boxH = 58;
  const boxY = ctx.y - boxH;
  ctx.page.drawRectangle({
    x: PDF_PAGE.margin,
    y: boxY,
    width: contentWidth(),
    height: boxH,
    color: PDF_THEME.elevated,
    borderColor: PDF_THEME.line,
    borderWidth: 0.5,
  });

  const n = parts.length;
  const usable = contentWidth() - 20;
  const stepX = usable / Math.max(n, 1);

  parts.forEach((part, i) => {
    const cx = PDF_PAGE.margin + 10 + stepX * i + stepX / 2;
    const cy = boxY + 34;
    const color = ACCENTS[i % ACCENTS.length];
    if (i < n - 1) {
      line(
        ctx.page,
        cx + 12,
        cy,
        cx + stepX - 12,
        cy,
        PDF_THEME.line,
        1
      );
    }
    ctx.page.drawCircle({
      x: cx,
      y: cy,
      size: 10,
      color,
    });
    const num = String(i + 1);
    const nw = ctx.fonts.bodyBold.widthOfTextAtSize(num, 8);
    ctx.page.drawText(num, {
      x: cx - nw / 2,
      y: cy - 3,
      size: 8,
      font: ctx.fonts.bodyBold,
      color: PDF_THEME.white,
    });

    const { title } = cleanComponentDisplayName(part.name, part.make);
    const short =
      title.length > 12 ? `${title.slice(0, 11)}…` : title;
    const tw = ctx.fonts.body.widthOfTextAtSize(short, 6.5);
    ctx.page.drawText(short, {
      x: cx - tw / 2,
      y: boxY + 8,
      size: 6.5,
      font: ctx.fonts.body,
      color: PDF_THEME.ink,
    });
  });

  ctx.y = boxY - 12;
}

/** Full visual block for one pattern component: chart + diagrams + legend. */
export function drawComponentVisuals(
  ctx: LayoutCtx,
  component: PatternComponent
): void {
  const mode = detectConstructionMode(component);
  if (mode === "note") return;

  const hasChart = drawStitchCountChart(ctx, component);
  const hasDiagrams = drawComponentStitchDiagrams(ctx, component);
  if (hasDiagrams || hasChart) {
    drawSymbolLegend(ctx, collectComponentSymbolKinds(component));
  }
  drawSpacer(ctx, 6);
}
