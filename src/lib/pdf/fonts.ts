import { readFile } from "fs/promises";
import path from "path";
import fontkit from "@pdf-lib/fontkit";
import type { PDFDocument, PDFFont } from "pdf-lib";

export type PdfFonts = {
  display: PDFFont;
  body: PDFFont;
  bodyBold: PDFFont;
};

const FONT_DIR = path.join(process.cwd(), "src/lib/pdf/fonts");

async function loadFontBytes(filename: string): Promise<Uint8Array> {
  const buf = await readFile(path.join(FONT_DIR, filename));
  return new Uint8Array(buf);
}

/** Embed Loopcraft display + body fonts (OFL static Latin subsets). */
export async function embedPdfFonts(pdf: PDFDocument): Promise<PdfFonts> {
  pdf.registerFontkit(fontkit);

  const [displayBytes, bodyBytes, bodyBoldBytes] = await Promise.all([
    loadFontBytes("Fraunces-SemiBold.ttf"),
    loadFontBytes("SourceSans3-Regular.ttf"),
    loadFontBytes("SourceSans3-Semibold.ttf"),
  ]);

  const [display, body, bodyBold] = await Promise.all([
    pdf.embedFont(displayBytes, { subset: true }),
    pdf.embedFont(bodyBytes, { subset: true }),
    pdf.embedFont(bodyBoldBytes, { subset: true }),
  ]);

  return { display, body, bodyBold };
}
