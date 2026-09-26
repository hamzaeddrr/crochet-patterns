import { PDFDocument } from "pdf-lib";
import type { CrochetPattern, PatternComponent } from "@/types";
import { readPublicAsset, savePublicAsset } from "@/lib/storage/assets";
import {
  cleanComponentDisplayName,
  detectConstructionMode,
  isAccessoryOrNoteRound,
  stepLabelForMode,
} from "@/lib/crochet/construction";
import { embedPdfFonts } from "./fonts";
import {
  drawChip,
  drawComponentBanner,
  drawContentHeader,
  drawNumberedStep,
  drawParagraph,
  drawSectionHeading,
  drawSpacer,
  drawTableHeader,
  drawTableRow,
  ensureSpace,
  stampFooters,
  truncateToWidth,
  wrapText,
  type LayoutCtx,
} from "./layout";
import {
  PDF_PAGE,
  PDF_THEME,
  colorFromName,
  contentWidth,
} from "./theme";

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Strip trailing "(12)" if we already print the stitch count separately. */
function cleanInstructions(instructions: string, result?: number): string {
  let text = instructions.trim();
  if (typeof result === "number") {
    const re = new RegExp(`\\s*\\(${result}\\)\\s*$`);
    text = text.replace(re, "").trim();
    text = text.replace(re, "").trim();
  }
  text = text.replace(/\s*\((\d+)\)\s*\(\1\)\s*$/g, " ($1)").trim();
  return text;
}

function cleanStep(step: string): string {
  return step.replace(/^\s*(\d+\.\s*)+/g, "").trim();
}

function formatSizeCm(size?: number): string {
  if (!size || !Number.isFinite(size)) return "—";
  const rounded = Math.round(size * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
}

async function embedPatternImage(
  pdf: Awaited<ReturnType<typeof PDFDocument.create>>,
  imagePath: string
) {
  const imgBytes = await readPublicAsset(imagePath);
  const isJpg =
    /\.jpe?g($|\?)/i.test(imagePath) || imagePath.includes("image/jpeg");
  if (isJpg) return pdf.embedJpg(imgBytes);
  const png = await (await import("sharp")).default(imgBytes).png().toBuffer();
  return pdf.embedPng(png);
}

async function drawCover(
  pdf: Awaited<ReturnType<typeof PDFDocument.create>>,
  fonts: Awaited<ReturnType<typeof embedPdfFonts>>,
  pattern: CrochetPattern
): Promise<void> {
  const page = pdf.addPage([PDF_PAGE.width, PDF_PAGE.height]);
  const { width, height, margin } = PDF_PAGE;
  const title = pattern.content.title.en;
  const difficulty = capitalize(pattern.designSpec.difficulty);
  const sizeLabel = formatSizeCm(pattern.designSpec.size_cm);
  const timeLabel = pattern.designSpec.estimated_time || "—";

  // Soft bone base
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: PDF_THEME.boneDeep,
  });

  // Decorative celadon wash top
  page.drawRectangle({
    x: 0,
    y: height - 160,
    width,
    height: 160,
    color: PDF_THEME.celadon,
    opacity: 0.18,
  });

  let imageDrawn = false;
  if (pattern.imagePath) {
    try {
      const image = await embedPatternImage(pdf, pattern.imagePath);
      // Full-bleed-ish hero: edge to edge with small side margin
      const maxW = width;
      const maxH = height * 0.62;
      const scale = Math.max(maxW / image.width, maxH / image.height);
      const w = image.width * scale;
      const h = image.height * scale;
      const x = (width - w) / 2;
      const y = height - h;
      page.drawImage(image, { x, y, width: w, height: h });
      imageDrawn = true;

      // Gradient-like overlay slab at bottom of image
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height: Math.min(h * 0.42, 280),
        color: PDF_THEME.coverOverlay,
        opacity: 0.72,
      });
    } catch {
      imageDrawn = false;
    }
  }

  if (!imageDrawn) {
    page.drawRectangle({
      x: 0,
      y: height * 0.35,
      width,
      height: height * 0.65,
      color: PDF_THEME.elevated,
    });
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height: height * 0.42,
      color: PDF_THEME.coverOverlay,
      opacity: 0.85,
    });
  }

  // Brand
  page.drawText("LOOPCRAFT", {
    x: margin,
    y: height - 36,
    size: 11,
    font: fonts.bodyBold,
    color: imageDrawn ? PDF_THEME.white : PDF_THEME.apricot,
  });
  page.drawText("Studio crochet pattern", {
    x: margin,
    y: height - 52,
    size: 9,
    font: fonts.body,
    color: imageDrawn ? PDF_THEME.bone : PDF_THEME.muted,
  });

  // Badge free/paid
  const badge = pattern.free ? "Free pattern" : "Premium pattern";
  drawChip(
    page,
    fonts,
    badge,
    width - margin - fonts.bodyBold.widthOfTextAtSize(badge, 9) - 16,
    height - 44,
    PDF_THEME.apricot,
    PDF_THEME.white
  );

  // Title slab
  const titleSize = 26;
  const titleLines = wrapText(title, fonts.display, titleSize, contentWidth());
  let ty = 148;
  for (const line of titleLines.slice(0, 3)) {
    page.drawText(line, {
      x: margin,
      y: ty,
      size: titleSize,
      font: fonts.display,
      color: PDF_THEME.white,
    });
    ty -= 32;
  }

  // Meta chips
  let cx = margin;
  const chipY = 78;
  const chips = [
    difficulty,
    `${sizeLabel} cm`,
    timeLabel,
  ];
  for (const chip of chips) {
    cx += drawChip(
      page,
      fonts,
      chip,
      cx,
      chipY,
      PDF_THEME.apricotDeep,
      PDF_THEME.white
    );
  }

  page.drawText("loopcraft · printable PDF", {
    x: margin,
    y: 36,
    size: 8,
    font: fonts.body,
    color: PDF_THEME.softMuted,
  });
}

function startContentPage(
  pdf: Awaited<ReturnType<typeof PDFDocument.create>>,
  fonts: Awaited<ReturnType<typeof embedPdfFonts>>,
  patternTitle: string
): LayoutCtx {
  const page = pdf.addPage([PDF_PAGE.width, PDF_PAGE.height]);
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PDF_PAGE.width,
    height: PDF_PAGE.height,
    color: PDF_THEME.bone,
  });
  const y = drawContentHeader(page, fonts, patternTitle);
  return { pdf, fonts, patternTitle, page, y };
}

function writeComponent(ctx: LayoutCtx, component: PatternComponent): void {
  const mode = detectConstructionMode(component);
  const step = stepLabelForMode(mode);
  const { title } = cleanComponentDisplayName(component.name, component.make);

  drawComponentBanner(ctx, title, component.make);
  if (component.notes?.trim()) {
    drawParagraph(ctx, component.notes.trim(), {
      size: 9.5,
      color: PDF_THEME.muted,
    });
    drawSpacer(ctx, 6);
  }

  const stepW = 58;
  const countW = 48;
  drawTableHeader(ctx, [
    {
      label: step.toUpperCase(),
      x: PDF_PAGE.margin + 6,
      width: stepW,
    },
    {
      label: "INSTRUCTIONS",
      x: PDF_PAGE.margin + stepW,
      width: contentWidth() - stepW - countW,
    },
    {
      label: "COUNT",
      x: PDF_PAGE.margin + contentWidth() - countW + 4,
      width: countW,
    },
  ]);

  component.rounds.forEach((r, i) => {
    const accessory = isAccessoryOrNoteRound(r) || mode === "note";
    const instr = cleanInstructions(
      r.instructions,
      accessory ? undefined : r.result
    );
    const count =
      !accessory && typeof r.result === "number" && r.result > 0
        ? String(r.result)
        : "—";
    const stepLabel =
      mode === "note" ? String(r.round) : `${step} ${r.round}`;
    drawTableRow(ctx, {
      index: i,
      stepLabel,
      instructions: instr,
      count,
      stepW,
      countW,
    });
  });

  drawSpacer(ctx, 14);
}

export async function buildPatternPdf(
  pattern: CrochetPattern
): Promise<string> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(pattern.content.title.en);
  pdf.setAuthor("Loopcraft");
  pdf.setSubject("Crochet pattern");
  pdf.setCreator("Loopcraft Studio");

  const fonts = await embedPdfFonts(pdf);
  const title = pattern.content.title.en;
  const difficulty = capitalize(pattern.designSpec.difficulty);
  const sizeLabel = formatSizeCm(pattern.designSpec.size_cm);
  const timeLabel = pattern.designSpec.estimated_time || "—";

  await drawCover(pdf, fonts, pattern);

  const ctx = startContentPage(pdf, fonts, title);

  // —— Overview ——
  drawSectionHeading(ctx, "Overview");
  if (pattern.content.summary.en?.trim()) {
    drawParagraph(ctx, pattern.content.summary.en.trim(), { size: 11 });
    drawSpacer(ctx, 10);
  }

  ensureSpace(ctx, 70);
  ctx.page.drawRectangle({
    x: PDF_PAGE.margin,
    y: ctx.y - 52,
    width: contentWidth(),
    height: 58,
    color: PDF_THEME.elevated,
  });
  const metaBits = [
    `Difficulty  ${difficulty}`,
    `Size  ${sizeLabel} cm`,
    `Time  ${timeLabel}`,
  ];
  let mx = PDF_PAGE.margin + 14;
  for (const bit of metaBits) {
    ctx.page.drawText(bit, {
      x: mx,
      y: ctx.y - 22,
      size: 10,
      font: fonts.bodyBold,
      color: PDF_THEME.ink,
    });
    mx += contentWidth() / 3;
  }
  ctx.y -= 70;

  drawParagraph(ctx, "What you’ll make", { size: 12, bold: true });
  drawSpacer(ctx, 4);
  pattern.content.components.forEach((c, i) => {
    const { title: name } = cleanComponentDisplayName(c.name, c.make);
    const make = c.make && c.make > 1 ? c.make : 1;
    drawParagraph(ctx, `${i + 1}.  ${make} × ${name}`, { size: 10.5 });
  });
  drawSpacer(ctx, 16);

  // —— Materials ——
  drawSectionHeading(ctx, "Materials");

  const colors = pattern.designSpec.colors || [];
  if (colors.length) {
    drawParagraph(ctx, "Color palette", { size: 10, bold: true });
    drawSpacer(ctx, 4);
    ensureSpace(ctx, 28);
    let sx = PDF_PAGE.margin;
    for (const c of colors.slice(0, 10)) {
      const fill = colorFromName(c);
      ctx.page.drawCircle({
        x: sx + 7,
        y: ctx.y + 2,
        size: 7,
        color: fill,
        borderColor: PDF_THEME.line,
        borderWidth: 0.6,
      });
      const label = truncateToWidth(c.replace(/_/g, " "), fonts.body, 8, 70);
      ctx.page.drawText(label, {
        x: sx + 18,
        y: ctx.y,
        size: 8,
        font: fonts.body,
        color: PDF_THEME.muted,
      });
      sx += 96;
      if (sx > PDF_PAGE.width - PDF_PAGE.margin - 80) {
        sx = PDF_PAGE.margin;
        ctx.y -= 22;
        ensureSpace(ctx, 22);
      }
    }
    ctx.y -= 24;
  }

  drawParagraph(ctx, "Yarn", { size: 10, bold: true });
  for (const y of pattern.content.materials.yarn) {
    drawParagraph(ctx, `•  ${y}`, { size: 10.5 });
  }
  drawSpacer(ctx, 8);

  ensureSpace(ctx, 56);
  ctx.page.drawRectangle({
    x: PDF_PAGE.margin,
    y: ctx.y - 48,
    width: contentWidth(),
    height: 54,
    color: PDF_THEME.elevated,
  });
  ctx.page.drawText("Hook", {
    x: PDF_PAGE.margin + 12,
    y: ctx.y - 14,
    size: 8,
    font: fonts.bodyBold,
    color: PDF_THEME.muted,
  });
  ctx.page.drawText(pattern.content.materials.hook, {
    x: PDF_PAGE.margin + 12,
    y: ctx.y - 28,
    size: 11,
    font: fonts.bodyBold,
    color: PDF_THEME.ink,
  });
  const notions = pattern.content.materials.notions.join(", ");
  ctx.page.drawText("Notions", {
    x: PDF_PAGE.margin + contentWidth() * 0.35,
    y: ctx.y - 14,
    size: 8,
    font: fonts.bodyBold,
    color: PDF_THEME.muted,
  });
  const notionLines = wrapText(
    notions,
    fonts.body,
    10,
    contentWidth() * 0.6 - 16
  );
  let ny = ctx.y - 28;
  for (const line of notionLines.slice(0, 2)) {
    ctx.page.drawText(line, {
      x: PDF_PAGE.margin + contentWidth() * 0.35,
      y: ny,
      size: 10,
      font: fonts.body,
      color: PDF_THEME.ink,
    });
    ny -= 12;
  }
  ctx.y -= 66;

  if (pattern.content.materials.gauge) {
    drawParagraph(ctx, `Gauge: ${pattern.content.materials.gauge}`, {
      size: 10,
      color: PDF_THEME.muted,
    });
  }
  drawSpacer(ctx, 14);

  // —— Abbreviations ——
  drawSectionHeading(ctx, "Abbreviations (US)");
  const abbrs = pattern.content.abbreviations;
  const colW = contentWidth() / 2;
  for (let i = 0; i < abbrs.length; i += 2) {
    ensureSpace(ctx, 16);
    const left = abbrs[i];
    const right = abbrs[i + 1];
    ctx.page.drawText(left.abbr, {
      x: PDF_PAGE.margin,
      y: ctx.y,
      size: 10,
      font: fonts.bodyBold,
      color: PDF_THEME.apricot,
    });
    const leftMean = truncateToWidth(
      left.meaning,
      fonts.body,
      9.5,
      colW - 48
    );
    ctx.page.drawText(leftMean, {
      x: PDF_PAGE.margin + 36,
      y: ctx.y,
      size: 9.5,
      font: fonts.body,
      color: PDF_THEME.ink,
    });
    if (right) {
      ctx.page.drawText(right.abbr, {
        x: PDF_PAGE.margin + colW,
        y: ctx.y,
        size: 10,
        font: fonts.bodyBold,
        color: PDF_THEME.apricot,
      });
      const rightMean = truncateToWidth(
        right.meaning,
        fonts.body,
        9.5,
        colW - 48
      );
      ctx.page.drawText(rightMean, {
        x: PDF_PAGE.margin + colW + 36,
        y: ctx.y,
        size: 9.5,
        font: fonts.body,
        color: PDF_THEME.ink,
      });
    }
    ctx.y -= 15;
  }
  drawSpacer(ctx, 16);

  // —— Components ——
  drawSectionHeading(ctx, "Instructions");
  for (const component of pattern.content.components) {
    writeComponent(ctx, component);
  }

  // —— Assembly ——
  if (pattern.content.assembly.length) {
    drawSectionHeading(ctx, "Assembly");
    pattern.content.assembly.forEach((step, i) => {
      drawNumberedStep(ctx, i + 1, cleanStep(step));
    });
    drawSpacer(ctx, 8);
  }

  // —— Finishing ——
  if (pattern.content.finishing.length) {
    drawSectionHeading(ctx, "Finishing");
    pattern.content.finishing.forEach((step, i) => {
      drawNumberedStep(ctx, i + 1, cleanStep(step));
    });
  }

  stampFooters(pdf, fonts, true);

  const bytes = await pdf.save();
  return savePublicAsset(
    `patterns/${pattern.id}/pattern.pdf`,
    Buffer.from(bytes),
    "application/pdf"
  );
}
