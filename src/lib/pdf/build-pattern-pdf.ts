import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { CrochetPattern } from "@/types";
import { readPublicAsset, savePublicAsset } from "@/lib/storage/assets";

function wrapText(
  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  size: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
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

  // Cover
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
      y: pageH - 120,
      width: pageW,
      height: 120,
      color: rose,
    });
    page.drawText("LOOPCRAFT", {
      x: margin,
      y: pageH - 55,
      size: 14,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText("Crochet Pattern", {
      x: margin,
      y: pageH - 78,
      size: 11,
      font,
      color: rgb(1, 0.92, 0.94),
    });

    if (pattern.imagePath) {
      try {
        const imgBytes = await readPublicAsset(pattern.imagePath);
        const isJpg =
          /\.jpe?g($|\?)/i.test(pattern.imagePath) ||
          pattern.imagePath.includes("image/jpeg");
        const image = isJpg
          ? await pdf.embedJpg(imgBytes)
          : await pdf.embedPng(
              await (
                await import("sharp")
              )
                .default(imgBytes)
                .png()
                .toBuffer()
            );
        const maxW = pageW - margin * 2;
        const maxH = 360;
        const scale = Math.min(maxW / image.width, maxH / image.height);
        const w = image.width * scale;
        const h = image.height * scale;
        page.drawImage(image, {
          x: (pageW - w) / 2,
          y: pageH - 160 - h,
          width: w,
          height: h,
        });
      } catch {
        // image optional on cover
      }
    }

    const title = pattern.content.title.en;
    page.drawText(title.slice(0, 60), {
      x: margin,
      y: 160,
      size: 22,
      font: fontBold,
      color: ink,
    });
    page.drawText(
      `${pattern.designSpec.difficulty} · ${pattern.designSpec.size_cm || "—"} cm · ${pattern.confidence} confidence`,
      {
        x: margin,
        y: 130,
        size: 11,
        font,
        color: muted,
      }
    );
    page.drawText("Reviewed draft — always swatch and check gauge.", {
      x: margin,
      y: 70,
      size: 9,
      font,
      color: muted,
    });
  }

  const addTextPage = (heading: string, blocks: string[]) => {
    let page = pdf.addPage([pageW, pageH]);
    let y = pageH - margin;
    const drawHeading = () => {
      page.drawText(heading, {
        x: margin,
        y,
        size: 16,
        font: fontBold,
        color: rose,
      });
      y -= 28;
    };
    drawHeading();
    for (const block of blocks) {
      const lines = wrapText(block, font, 11, pageW - margin * 2);
      for (const line of lines) {
        if (y < margin + 40) {
          page = pdf.addPage([pageW, pageH]);
          y = pageH - margin;
          drawHeading();
        }
        page.drawText(line, { x: margin, y, size: 11, font, color: ink });
        y -= 16;
      }
      y -= 10;
    }
  };

  addTextPage("Project info", [
    pattern.content.summary.en,
    `Difficulty: ${pattern.designSpec.difficulty}`,
    `Finished size: ${pattern.designSpec.size_cm || "see pattern"} cm`,
    `Estimated time: ${pattern.designSpec.estimated_time || "—"}`,
    `Yarn: ${pattern.designSpec.yarn_weight || "—"} · Hook: ${pattern.designSpec.hook_mm || pattern.content.materials.hook} mm`,
    `Confidence: ${pattern.confidence} (AI-assisted draft — test before selling as verified)`,
  ]);

  addTextPage("Materials", [
    `Yarn: ${pattern.content.materials.yarn.join("; ")}`,
    `Hook: ${pattern.content.materials.hook}`,
    `Notions: ${pattern.content.materials.notions.join(", ")}`,
    pattern.content.materials.gauge
      ? `Gauge: ${pattern.content.materials.gauge}`
      : "",
  ].filter(Boolean));

  addTextPage(
    "Abbreviations (US)",
    pattern.content.abbreviations.map((a) => `${a.abbr} — ${a.meaning}`)
  );

  for (const component of pattern.content.components) {
    const lines = [
      component.make && component.make > 1 ? `Make ${component.make}.` : "",
      component.notes || "",
      ...component.rounds.map(
        (r) =>
          `Rnd ${r.round}: ${r.instructions}${r.result ? ` (${r.result})` : ""}`
      ),
    ].filter(Boolean);
    addTextPage(component.name, lines);
  }

  if (pattern.content.assembly.length) {
    addTextPage(
      "Assembly",
      pattern.content.assembly.map((s, i) => `${i + 1}. ${s}`)
    );
  }
  if (pattern.content.finishing.length) {
    addTextPage(
      "Finishing",
      pattern.content.finishing.map((s, i) => `${i + 1}. ${s}`)
    );
  }

  // Page numbers
  const pages = pdf.getPages();
  pages.forEach((page, i) => {
    page.drawText(`${i + 1} / ${pages.length}`, {
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
