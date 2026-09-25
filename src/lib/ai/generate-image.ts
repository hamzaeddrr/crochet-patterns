import sharp from "sharp";
import { getOpenAI } from "./openai";
import {
  designSpecToImagePrompt,
  patternContentToImagePrompt,
} from "./design-spec";
import {
  resolveImageModel,
  resolveImageQuality,
  resolveImageSize,
} from "@/lib/admin/settings-store";
import {
  isFlareGenerateQuality,
  isFlareModel,
  type FlareGenerateQuality,
} from "./flare-types";
import { savePublicAsset } from "@/lib/storage/assets";
import type { DesignSpec, PatternContent } from "@/types";

export interface GeneratedImagePaths {
  imagePath: string;
  thumbnailPath: string;
  promptUsed: string;
  model: string;
  quality: string;
  size: string;
}

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
  rawSize: string,
  preferLandscape: boolean
): { quality: string; size: string } {
  const flare = isFlareModel(model);

  let size = (
    rawSize ||
    (preferLandscape ? "1536x1024" : flare ? "auto" : "1024x1024")
  ).toLowerCase();
  if (!STANDARD_SIZES.has(size)) {
    size = preferLandscape ? "1536x1024" : flare ? "auto" : "1024x1024";
  }
  if (!flare && size === "auto") {
    size = preferLandscape ? "1536x1024" : "1024x1024";
  }
  // Multi-step storyboard reads better in landscape
  if (preferLandscape && size === "1024x1024") {
    size = "1536x1024";
  }

  let quality = (rawQuality || "high").toLowerCase();
  if (flare) {
    if (!isFlareGenerateQuality(quality)) {
      quality = "high" satisfies FlareGenerateQuality;
    }
  } else if (!GPT_IMAGE_QUALITIES.has(quality)) {
    if (quality === "xhigh" || quality === "max") quality = "high";
    else quality = "high";
  }

  return { quality, size };
}

export async function generatePatternImage(
  patternId: string,
  spec: DesignSpec,
  customPrompt?: string,
  content?: PatternContent
): Promise<GeneratedImagePaths> {
  const openai = await getOpenAI();
  const fromPattern = Boolean(content?.components?.length);
  const promptUsed =
    customPrompt?.trim() ||
    (content
      ? patternContentToImagePrompt(spec, content)
      : designSpecToImagePrompt(spec));
  const model = await resolveImageModel();
  const { quality, size } = resolveSafeImageParams(
    model,
    await resolveImageQuality(),
    await resolveImageSize(),
    fromPattern
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
  };

  try {
    result = (await openai.images.generate(
      body as unknown as Parameters<typeof openai.images.generate>[0]
    )) as typeof result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("Image generate retry after:", message);
    const fallback: Record<string, unknown> = {
      model,
      prompt: promptUsed,
      n: 1,
      size: isFlareModel(model)
        ? "auto"
        : fromPattern
          ? "1536x1024"
          : "1024x1024",
      quality: "high",
    };
    result = (await openai.images.generate(
      fallback as unknown as Parameters<typeof openai.images.generate>[0]
    )) as typeof result;
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

  const canvas = { r: 250, g: 247, b: 242, alpha: 1 };

  // Keep full collage visible (no crop) — cards use object-contain
  const heroBuf = await sharp(buffer)
    .resize(1400, fromPattern ? 1000 : 1400, {
      fit: "contain",
      background: canvas,
    })
    .webp({ quality: 88 })
    .toBuffer();

  const thumbBuf = await sharp(buffer)
    .resize(640, fromPattern ? 460 : 640, {
      fit: "contain",
      background: canvas,
    })
    .webp({ quality: 80 })
    .toBuffer();

  const stamp = Date.now();
  const imagePath = await savePublicAsset(
    `patterns/${patternId}/hero-${stamp}.webp`,
    heroBuf,
    "image/webp"
  );
  const thumbnailPath = await savePublicAsset(
    `patterns/${patternId}/thumb-${stamp}.webp`,
    thumbBuf,
    "image/webp"
  );

  return {
    imagePath,
    thumbnailPath,
    promptUsed,
    model,
    quality,
    size,
  };
}
