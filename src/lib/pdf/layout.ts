import type { PDFDocument, PDFFont, PDFPage, RGB } from "pdf-lib";
import type { PdfFonts } from "./fonts";
import { PDF_PAGE, PDF_THEME, contentWidth } from "./theme";

export function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export function truncateToWidth(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && font.widthOfTextAtSize(`${t}…`, size) > maxWidth) {
    t = t.slice(0, -1);
  }
  return `${t}…`;
}

export type LayoutCtx = {
  pdf: PDFDocument;
  fonts: PdfFonts;
  patternTitle: string;
  page: PDFPage;
  y: number;
};

/** Draw header chrome on a content page; returns y below header. */
export function drawContentHeader(
  page: PDFPage,
  fonts: PdfFonts,
  patternTitle: string
): number {
  const { width, height, margin } = PDF_PAGE;
  const top = height - 22;

  page.drawRectangle({
    x: 0,
    y: height - 4,
    width,
    height: 4,
    color: PDF_THEME.apricot,
  });

  page.drawText("LOOPCRAFT", {
    x: margin,
    y: top - 14,
    size: 9,
    font: fonts.bodyBold,
    color: PDF_THEME.apricot,
  });

  const title = truncateToWidth(
    patternTitle,
    fonts.body,
    9,
    contentWidth() * 0.55
  );
  const tw = fonts.body.widthOfTextAtSize(title, 9);
  page.drawText(title, {
    x: width - margin - tw,
    y: top - 14,
    size: 9,
    font: fonts.body,
    color: PDF_THEME.muted,
  });

  page.drawLine({
    start: { x: margin, y: height - margin - 8 },
    end: { x: width - margin, y: height - margin - 8 },
    thickness: 0.6,
    color: PDF_THEME.line,
  });

  return height - margin - 28;
}

/** Stamp footers + page numbers on every page except the cover (index 0). */
export function stampFooters(
  pdf: PDFDocument,
  fonts: PdfFonts,
  skipCover = true
): void {
  const pages = pdf.getPages();
  const total = pages.length;
  pages.forEach((page, i) => {
    if (skipCover && i === 0) return;
    const pageNo = skipCover ? i : i + 1;
    const pageTotal = skipCover ? total - 1 : total;
    const numLabel = `${pageNo} / ${pageTotal}`;

    page.drawLine({
      start: { x: PDF_PAGE.margin, y: 36 },
      end: { x: PDF_PAGE.width - PDF_PAGE.margin, y: 36 },
      thickness: 0.5,
      color: PDF_THEME.line,
    });

    page.drawText("Personal use pattern · Loopcraft", {
      x: PDF_PAGE.margin,
      y: 22,
      size: 8,
      font: fonts.body,
      color: PDF_THEME.softMuted,
    });

    const nw = fonts.body.widthOfTextAtSize(numLabel, 8);
    page.drawText(numLabel, {
      x: PDF_PAGE.width - PDF_PAGE.margin - nw,
      y: 22,
      size: 8,
      font: fonts.body,
      color: PDF_THEME.softMuted,
    });
  });
}

export function ensureSpace(ctx: LayoutCtx, needed: number): void {
  const minY = PDF_PAGE.margin + PDF_PAGE.footerH;
  if (ctx.y - needed >= minY) return;
  ctx.page = ctx.pdf.addPage([PDF_PAGE.width, PDF_PAGE.height]);
  // soft page fill
  ctx.page.drawRectangle({
    x: 0,
    y: 0,
    width: PDF_PAGE.width,
    height: PDF_PAGE.height,
    color: PDF_THEME.bone,
  });
  ctx.y = drawContentHeader(ctx.page, ctx.fonts, ctx.patternTitle);
}

export function drawSectionHeading(ctx: LayoutCtx, heading: string): void {
  ensureSpace(ctx, 36);
  ctx.page.drawText(heading, {
    x: PDF_PAGE.margin,
    y: ctx.y,
    size: 18,
    font: ctx.fonts.display,
    color: PDF_THEME.ink,
  });
  ctx.y -= 8;
  ctx.page.drawRectangle({
    x: PDF_PAGE.margin,
    y: ctx.y,
    width: 36,
    height: 2.5,
    color: PDF_THEME.apricot,
  });
  ctx.y -= 18;
}

export function drawParagraph(
  ctx: LayoutCtx,
  text: string,
  opts?: { size?: number; bold?: boolean; color?: RGB; indent?: number }
): void {
  const size = opts?.size ?? 10.5;
  const font = opts?.bold ? ctx.fonts.bodyBold : ctx.fonts.body;
  const color = opts?.color ?? PDF_THEME.ink;
  const indent = opts?.indent ?? 0;
  const maxW = contentWidth() - indent;
  const lines = wrapText(text, font, size, maxW);
  for (const line of lines) {
    ensureSpace(ctx, size + 6);
    ctx.page.drawText(line, {
      x: PDF_PAGE.margin + indent,
      y: ctx.y,
      size,
      font,
      color,
    });
    ctx.y -= size + 4;
  }
}

export function drawSpacer(ctx: LayoutCtx, px = 10): void {
  ctx.y -= px;
}

export function drawChip(
  page: PDFPage,
  fonts: PdfFonts,
  label: string,
  x: number,
  y: number,
  bg: RGB,
  fg: RGB
): number {
  const padX = 8;
  const size = 9;
  const tw = fonts.bodyBold.widthOfTextAtSize(label, size);
  const w = tw + padX * 2;
  const h = 18;
  page.drawRectangle({
    x,
    y: y - 4,
    width: w,
    height: h,
    color: bg,
    borderColor: bg,
    borderWidth: 0,
  });
  // rounded look approximation via overlapping — pdf-lib has no roundRect; keep sharp
  page.drawText(label, {
    x: x + padX,
    y: y + 1,
    size,
    font: fonts.bodyBold,
    color: fg,
  });
  return w + 6;
}

export function drawComponentBanner(
  ctx: LayoutCtx,
  title: string,
  make?: number
): void {
  ensureSpace(ctx, 40);
  const h = 28;
  ctx.page.drawRectangle({
    x: PDF_PAGE.margin,
    y: ctx.y - 8,
    width: contentWidth(),
    height: h,
    color: PDF_THEME.apricot,
  });
  const label =
    make && make > 1 ? `${title}  ·  Make ${make}` : title;
  ctx.page.drawText(label, {
    x: PDF_PAGE.margin + 12,
    y: ctx.y,
    size: 12,
    font: ctx.fonts.bodyBold,
    color: PDF_THEME.white,
  });
  ctx.y -= h + 10;
}

export function drawTableHeader(
  ctx: LayoutCtx,
  cols: { label: string; x: number; width: number }[]
): void {
  ensureSpace(ctx, 22);
  ctx.page.drawRectangle({
    x: PDF_PAGE.margin,
    y: ctx.y - 4,
    width: contentWidth(),
    height: 18,
    color: PDF_THEME.elevated,
  });
  for (const col of cols) {
    ctx.page.drawText(col.label, {
      x: col.x,
      y: ctx.y,
      size: 8,
      font: ctx.fonts.bodyBold,
      color: PDF_THEME.muted,
    });
  }
  ctx.y -= 18;
}

export function drawTableRow(
  ctx: LayoutCtx,
  opts: {
    index: number;
    stepLabel: string;
    instructions: string;
    count: string;
    stepW: number;
    countW: number;
  }
): void {
  const { stepW, countW } = opts;
  const instrX = PDF_PAGE.margin + stepW;
  const instrW = contentWidth() - stepW - countW;
  const countX = PDF_PAGE.margin + contentWidth() - countW + 4;
  const fontSize = 9.5;
  const lines = wrapText(
    opts.instructions,
    ctx.fonts.body,
    fontSize,
    instrW - 8
  );
  const rowH = Math.max(18, lines.length * (fontSize + 3) + 8);
  ensureSpace(ctx, rowH + 2);

  if (opts.index % 2 === 0) {
    ctx.page.drawRectangle({
      x: PDF_PAGE.margin,
      y: ctx.y - rowH + 12,
      width: contentWidth(),
      height: rowH,
      color: PDF_THEME.boneDeep,
    });
  }

  ctx.page.drawText(opts.stepLabel, {
    x: PDF_PAGE.margin + 6,
    y: ctx.y,
    size: fontSize,
    font: ctx.fonts.bodyBold,
    color: PDF_THEME.gold,
  });

  let ly = ctx.y;
  for (const line of lines) {
    ctx.page.drawText(line, {
      x: instrX,
      y: ly,
      size: fontSize,
      font: ctx.fonts.body,
      color: PDF_THEME.ink,
    });
    ly -= fontSize + 3;
  }

  ctx.page.drawText(opts.count, {
    x: countX,
    y: ctx.y,
    size: fontSize,
    font: ctx.fonts.bodyBold,
    color: PDF_THEME.ink,
  });

  ctx.y -= rowH;
}

export function drawNumberedStep(
  ctx: LayoutCtx,
  index: number,
  text: string
): void {
  const size = 10.5;
  const bulletR = 8;
  const indent = 28;
  const lines = wrapText(text, ctx.fonts.body, size, contentWidth() - indent);
  const blockH = Math.max(20, lines.length * (size + 4) + 6);
  ensureSpace(ctx, blockH);

  const cy = ctx.y + 2;
  ctx.page.drawCircle({
    x: PDF_PAGE.margin + bulletR,
    y: cy,
    size: bulletR,
    color: PDF_THEME.celadon,
  });
  const n = String(index);
  const nw = ctx.fonts.bodyBold.widthOfTextAtSize(n, 8);
  ctx.page.drawText(n, {
    x: PDF_PAGE.margin + bulletR - nw / 2,
    y: cy - 3,
    size: 8,
    font: ctx.fonts.bodyBold,
    color: PDF_THEME.white,
  });

  let ly = ctx.y;
  for (const line of lines) {
    ctx.page.drawText(line, {
      x: PDF_PAGE.margin + indent,
      y: ly,
      size,
      font: ctx.fonts.body,
      color: PDF_THEME.ink,
    });
    ly -= size + 4;
  }
  ctx.y -= blockH;
}
