import sharp from "sharp";
import { getOpenAI } from "@/lib/ai/openai";
import {
  resolveImageModel,
  resolveImageQuality,
  resolveImageSize,
} from "@/lib/admin/settings-store";
import {
  isFlareGenerateQuality,
  isFlareModel,
  type FlareGenerateQuality,
} from "@/lib/ai/flare-types";
import { savePublicAsset } from "@/lib/storage/assets";
import {
  blueprintToPromptPanels,
  getTechniqueBlueprint,
} from "@/lib/crochet/technique-blueprints";
import type { Technique } from "@/types/techniques";

const STANDARD_SIZES = new Set([
  "1024x1024",
  "1024x1536",
  "1536x1024",
  "auto",
]);

const GPT_IMAGE_QUALITIES = new Set(["low", "medium", "high", "auto"]);

function resolveSafeImageParams(
  model: string,
  rawQuality: string,
  rawSize: string
): { quality: string; size: string } {
  const flare = isFlareModel(model);
  let size = (rawSize || "1536x1024").toLowerCase();
  if (!STANDARD_SIZES.has(size)) size = "1536x1024";
  if (!flare && size === "auto") size = "1536x1024";

  let quality = (rawQuality || "high").toLowerCase();
  if (flare) {
    if (!isFlareGenerateQuality(quality)) {
      quality = "high" satisfies FlareGenerateQuality;
    }
  } else if (!GPT_IMAGE_QUALITIES.has(quality)) {
    quality = "high";
  }
  return { quality, size };
}

/** Build a multi-panel storyboard prompt (no text in the image). */
export function buildTechniqueSheetPrompt(
  technique: Technique,
  cols: number,
  rows: number,
  qaFeedback?: string
): string {
  const bp = getTechniqueBlueprint(String(technique.key));
  const panels = bp
    ? blueprintToPromptPanels(bp)
    : technique.steps
        .slice(0, cols * rows)
        .map((s, i) => `Panel ${i + 1}: ${s.body.en || s.caption.en}`)
        .join("\n");

  return [
    `Create ONE single illustration sheet for a crochet beginner tutorial: "${technique.title.en || bp?.title || technique.slug}".`,
    `Layout: exact ${cols} columns × ${rows} rows equal panels in a clean grid, thin soft cream (#faf7f2) dividers between panels.`,
    `Brand style (Loopcraft — original art, do not imitate any existing brand drawings): polished flat vector crochet tutorial diagrams suitable for a premium yarn company guide. Cream background (#faf7f2), peach/apricot yarn (#d96b52), soft tan accents (#c49a5a), silver crochet hook with a sharp readable hook tip and throat, calm simplified hands with correct finger count, soft even lighting, identical camera angle in every panel.`,
    `Quality bar: each panel must be clear enough that a beginner can copy the motion without guessing. Prefer fewer, sharper details over decorative clutter.`,
    `Pedagogy: sequential one-motion panels left-to-right / top-to-bottom; yarn path continuous across panels.`,
    `Technical accuracy (mandatory):`,
    `- Exact hook entry point (ring opening, or both top loops of a stitch V).`,
    `- Exact yarn strand caught on the hook.`,
    `- Correct loop count on the hook for that step.`,
    `- Real crochet stitch anatomy (V-shaped tops / short posts) — never generic ribs, gears, or blobs.`,
    `- Hands must be able to perform the action shown.`,
    `CRITICAL: no letters, numbers, watermarks, logos, or captions inside the image.`,
    panels,
    qaFeedback
      ? `CORRECTIONS FROM FAILED QA (must fix):\n${qaFeedback}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateTechniqueSheet(
  technique: Technique,
  opts?: {
    cols?: number;
    rows?: number;
    customPrompt?: string;
    qaFeedback?: string;
  }
): Promise<{ sheetPath: string; promptUsed: string; model: string }> {
  const bp = getTechniqueBlueprint(String(technique.key));
  const cols = Math.max(
    1,
    opts?.cols ?? bp?.preferredCols ?? technique.sheetCols ?? 2
  );
  const rows = Math.max(
    1,
    opts?.rows ?? bp?.preferredRows ?? technique.sheetRows ?? 2
  );
  const promptUsed =
    opts?.customPrompt?.trim() ||
    buildTechniqueSheetPrompt(technique, cols, rows, opts?.qaFeedback);

  return generateStoryboardSheet({
    prompt: promptUsed,
    assetPath: `techniques/${technique.id}/sheet-${Date.now()}.webp`,
    usageLabel: "technique-sheet",
    patternId: technique.id,
  });
}

/** Low-level: one AI storyboard → saved webp (used by single + batch). */
export async function generateStoryboardSheet(opts: {
  prompt: string;
  assetPath: string;
  usageLabel?: string;
  patternId?: string;
}): Promise<{ sheetPath: string; promptUsed: string; model: string }> {
  const promptUsed = opts.prompt;
  const openai = await getOpenAI();
  const model = await resolveImageModel();
  const { quality, size } = resolveSafeImageParams(
    model,
    await resolveImageQuality(),
    await resolveImageSize()
  );

  const body: Record<string, unknown> = {
    model,
    prompt: promptUsed,
    size,
    quality,
    n: 1,
  };

  let result: {
    data?: Array<{ b64_json?: string | null; url?: string | null }>;
    usage?: Record<string, unknown>;
  };

  try {
    result = (await openai.images.generate(
      body as unknown as Parameters<typeof openai.images.generate>[0]
    )) as typeof result;
  } catch (err) {
    console.warn("Technique sheet generate retry:", err);
    result = (await openai.images.generate({
      model,
      prompt: promptUsed,
      n: 1,
      size: isFlareModel(model) ? "auto" : "1536x1024",
      quality: "high",
    } as unknown as Parameters<typeof openai.images.generate>[0])) as typeof result;
  }

  try {
    const { logImageUsage } = await import("@/lib/ai/usage-log");
    await logImageUsage({
      model,
      label: opts.usageLabel || "technique-sheet",
      usage: (result.usage as never) || null,
      quality,
      size,
      patternId: opts.patternId,
    });
  } catch (err) {
    console.warn("technique sheet usage log skipped:", err);
  }

  const b64 = result.data?.[0]?.b64_json;
  const url = result.data?.[0]?.url;
  let buffer: Buffer;
  if (b64) {
    buffer = Buffer.from(b64, "base64");
  } else if (url) {
    const res = await fetch(url);
    buffer = Buffer.from(await res.arrayBuffer());
  } else {
    throw new Error("Image generation returned no data");
  }

  const sheetBuf = await sharp(buffer)
    .resize(1536, 1024, {
      fit: "contain",
      background: { r: 250, g: 247, b: 242, alpha: 1 },
    })
    .webp({ quality: 90 })
    .toBuffer();

  const sheetPath = await savePublicAsset(
    opts.assetPath,
    sheetBuf,
    "image/webp"
  );

  return { sheetPath, promptUsed, model };
}
