import sharp from "sharp";
import {
  readPublicAsset,
  savePublicAsset,
} from "@/lib/storage/assets";

/**
 * Crop a multi-panel storyboard into individual step images (left→right, top→bottom).
 */
export async function cropSheetToStepImages(opts: {
  techniqueId: string;
  sheetPath: string;
  cols: number;
  rows: number;
  stepCount: number;
}): Promise<string[]> {
  const cols = Math.max(1, Math.floor(opts.cols));
  const rows = Math.max(1, Math.floor(opts.rows));
  const cells = cols * rows;
  const count = Math.min(Math.max(1, opts.stepCount), cells);

  const buf = await readPublicAsset(opts.sheetPath);
  const meta = await sharp(buf).metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  if (!width || !height) {
    throw new Error("Could not read sheet dimensions");
  }

  const cellW = Math.floor(width / cols);
  const cellH = Math.floor(height / rows);
  if (cellW < 32 || cellH < 32) {
    throw new Error("Sheet cells are too small — check cols/rows");
  }

  const stamp = Date.now();
  const paths: string[] = [];

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const left = col * cellW;
    const top = row * cellH;
    const extractW = col === cols - 1 ? width - left : cellW;
    const extractH = row === rows - 1 ? height - top : cellH;

    const cropped = await sharp(buf)
      .extract({ left, top, width: extractW, height: extractH })
      .resize(720, 520, {
        fit: "contain",
        background: { r: 250, g: 247, b: 242, alpha: 1 },
      })
      .webp({ quality: 86 })
      .toBuffer();

    const path = await savePublicAsset(
      `techniques/${opts.techniqueId}/step-${i + 1}-${stamp}.webp`,
      cropped,
      "image/webp"
    );
    paths.push(path);
  }

  return paths;
}
