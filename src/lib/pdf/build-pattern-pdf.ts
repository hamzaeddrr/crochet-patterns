import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { CrochetPattern, PatternComponent } from "@/types";
import { readPublicAsset, savePublicAsset } from "@/lib/storage/assets";

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

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
    // Also strip a second duplicate count if present: "(12) (12)"
    text = text.replace(re, "").trim();
  }
  text = text.replace(/\s*\((\d+)\)\s*\(\1\)\s*$/g, " ($1)").trim();
  return text;
}

/** Normalize "1. Step" / "1. 1. Step" → "Step" before we number. */
function cleanStep(step: string): string {
  return step.replace(/^\s*(\d+\.\s*)+/g, "").trim();
}

function formatSizeCm(size?: number): string {
  if (!size || !Number.isFinite(size)) return "—";
  const rounded = Math.round(size * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
}

function whatYouMakeLines(pattern: CrochetPattern): string[] {
  const lines: string[] = [];
  for (const c of pattern.content.components) {
    const make = c.make && c.make > 1 ? c.make : 1;
    const label = c.name.trim();
    if (!label) continue;
    lines.push(make > 1 ? `${make} × ${label}` : `1 × ${label}`);
  }
  if (!lines.length) {
    lines.push(`1 × ${pattern.content.title.en}`);
  }
  return lines;
}

export async function buildPatternPdf(
  pattern: CrochetPattern
): Promise<string> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const rose = rgb(0.78, 0.28, 0.45);
  const ink = rgb(0.15, 0.18, 0.2);
  const muted = rgb(0.4, 0.42, 0.45);
  const pageW = 595.28;
  const pageH = 841.89;
  const margin = 48;
  const contentW = pageW - margin * 2;
  const difficulty = capitalize(pattern.designSpec.difficulty);
  const sizeLabel = formatSizeCm(pattern.designSpec.size_cm);
  const timeLabel = pattern.designSpec.estimated_time || "—";
  const title = pattern.content.title.en;

  // —— Cover ——
  {
    const page = pdf.addPage([pageW, pageH]);
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageW,
      height: pageH,
      color: rgb(0.96, 0.95, 0.93),
    });
    page.drawRectangle({
      x: 0,
      y: pageH - 100,
      width: pageW,
      height: 100,
      color: rose,
    });
    page.drawText("LOOPCRAFT", {
      x: margin,
      y: pageH - 48,
      size: 14,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText("Crochet Pattern", {
      x: margin,
      y: pageH - 72,
      size: 11,
      font,
      color: rgb(1, 0.92, 0.94),
    });

    let imageBottom = pageH - 130;
    if (pattern.imagePath) {
      try {
        const imgBytes = await readPublicAsset(pattern.imagePath);
        const isJpg =
          /\.jpe?g($|\?)/i.test(pattern.imagePath) ||
          pattern.imagePath.includes("image/jpeg");
        const image = isJpg
          ? await pdf.embedJpg(imgBytes)
          : await pdf.embedPng(
              await (await import("sharp")).default(imgBytes).png().toBuffer()
            );
        const maxW = contentW;
        const maxH = 380;
        const scale = Math.min(maxW / image.width, maxH / image.height);
        const w = image.width * scale;
        const h = image.height * scale;
        const y = pageH - 130 - h;
        page.drawImage(image, {
          x: (pageW - w) / 2,
          y,
          width: w,
          height: h,
        });
        imageBottom = y - 24;
      } catch {
        imageBottom = pageH - 280;
      }
    } else {
      imageBottom = pageH - 280;
    }

    const titleY = Math.min(imageBottom, 200);
    const titleLines = wrapText(title, fontBold, 22, contentW);
    let ty = titleY;
    for (const line of titleLines.slice(0, 3)) {
      page.drawText(line, {
        x: margin,
        y: ty,
        size: 22,
        font: fontBold,
        color: ink,
      });
      ty -= 28;
    }
    page.drawText(
      `Difficulty: ${difficulty}  ·  Finished size: ${sizeLabel} cm  ·  Estimated time: ${timeLabel}`,
      {
        x: margin,
        y: Math.max(ty - 8, 56),
        size: 11,
        font,
        color: muted,
      }
    );
  }

  // Streaming multi-section layout (denser pages)
  let page: PDFPage = pdf.addPage([pageW, pageH]);
  let y = pageH - margin;

  const ensureSpace = (needed: number) => {
    if (y - needed < margin + 36) {
      page = pdf.addPage([pageW, pageH]);
      y = pageH - margin;
    }
  };

  const drawHeading = (heading: string) => {
    ensureSpace(40);
    page.drawText(heading, {
      x: margin,
      y,
      size: 16,
      font: fontBold,
      color: rose,
    });
    y -= 22;
  };

  const drawParagraph = (text: string, size = 11, bold = false) => {
    const f = bold ? fontBold : font;
    const lines = wrapText(text, f, size, contentW);
    for (const line of lines) {
      ensureSpace(16);
      page.drawText(line, { x: margin, y, size, font: f, color: ink });
      y -= 15;
    }
  };

  const drawSpacer = (px = 10) => {
    y -= px;
  };

  // —— What You'll Make ——
  drawHeading("What You'll Make");
  drawParagraph(title, 13, true);
  drawSpacer(6);
  drawParagraph(`Finished size: ${sizeLabel} cm`);
  drawParagraph(`Difficulty: ${difficulty}`);
  drawParagraph(`Estimated time: ${timeLabel}`);
  drawSpacer(8);
  drawParagraph("This pattern includes:", 11, true);
  drawSpacer(4);
  for (const item of whatYouMakeLines(pattern)) {
    drawParagraph(`•  ${item}`);
  }
  drawSpacer(6);
  if (pattern.content.summary.en?.trim()) {
    drawParagraph(pattern.content.summary.en.trim());
  }
  drawSpacer(16);

  // —— Materials ——
  drawHeading("Materials");
  drawParagraph(`Yarn: ${pattern.content.materials.yarn.join("; ")}`);
  drawParagraph(`Hook: ${pattern.content.materials.hook}`);
  drawParagraph(`Notions: ${pattern.content.materials.notions.join(", ")}`);
  if (pattern.content.materials.gauge) {
    drawParagraph(`Gauge: ${pattern.content.materials.gauge}`);
  }
  drawSpacer(16);

  // —— Abbreviations ——
  drawHeading("Abbreviations (US)");
  for (const a of pattern.content.abbreviations) {
    drawParagraph(`${a.abbr} — ${a.meaning}`);
  }
  drawSpacer(16);

  // —— Components ——
  const writeComponent = (component: PatternComponent) => {
    drawHeading(component.name);
    if (component.make && component.make > 1) {
      drawParagraph(`Make ${component.make}.`, 11, true);
    }
    if (component.notes?.trim()) {
      drawParagraph(component.notes.trim());
      drawSpacer(4);
    }
    for (const r of component.rounds) {
      const instr = cleanInstructions(r.instructions, r.result);
      const count =
        typeof r.result === "number" && r.result > 0 ? ` (${r.result})` : "";
      const prefix = component.construction === "flat" || /turn/i.test(instr)
        ? `Row ${r.round}`
        : `Rnd ${r.round}`;
      // If instructions already start with Rnd/Row, don't double-prefix awkwardly
      const body = /^(rnd|row|round)\s*\d+/i.test(instr)
        ? `${instr}${count}`
        : `${prefix}: ${instr}${count}`;
      drawParagraph(body);
    }
    drawSpacer(12);
  };

  for (const component of pattern.content.components) {
    writeComponent(component);
  }

  // —— Assembly ——
  if (pattern.content.assembly.length) {
    drawHeading("Assembly");
    pattern.content.assembly.forEach((step, i) => {
      drawParagraph(`${i + 1}. ${cleanStep(step)}`);
      drawSpacer(4);
    });
    drawSpacer(8);
  }

  // —— Finishing ——
  if (pattern.content.finishing.length) {
    drawHeading("Finishing");
    pattern.content.finishing.forEach((step, i) => {
      drawParagraph(`${i + 1}. ${cleanStep(step)}`);
      drawSpacer(4);
    });
  }

  // Page numbers
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawText(`${i + 1} / ${pages.length}`, {
      x: pageW - margin - 40,
      y: 24,
      size: 9,
      font,
      color: muted,
    });
  });

  const bytes = await pdf.save();
  return savePublicAsset(
    `patterns/${pattern.id}/pattern.pdf`,
    Buffer.from(bytes),
    "application/pdf"
  );
}
