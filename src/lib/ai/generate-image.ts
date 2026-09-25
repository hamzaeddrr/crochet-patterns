import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { getOpenAI } from "./openai";
import { designSpecToImagePrompt } from "./design-spec";
import {
  resolveImageModel,
  resolveImageQuality,
  resolveImageSize,
} from "@/lib/admin/settings-store";
import { isFlareModel } from "./flare-types";
import type { DesignSpec } from "@/types";

export interface GeneratedImagePaths {
  imagePath: string;
  thumbnailPath: string;
  promptUsed: string;
  model: string;
  quality: string;
  size: string;
}

export async function generatePatternImage(
  patternId: string,
  spec: DesignSpec,
  customPrompt?: string
): Promise<GeneratedImagePaths> {
  const openai = await getOpenAI();
  const promptUsed = customPrompt?.trim() || designSpecToImagePrompt(spec);
  const model = await resolveImageModel();
  const quality = await resolveImageQuality();
  const size = isFlareModel(model)
    ? (await resolveImageSize()) || "auto"
    : (await resolveImageSize()) === "auto"
      ? "1024x1024"
      : await resolveImageSize();

  const result = (await openai.images.generate({
    model,
    prompt: promptUsed,
    size: size as "1024x1024" | "auto",
    quality: quality as "high" | "auto",
    n: 1,
  } as Parameters<typeof openai.images.generate>[0])) as {
    data?: Array<{ b64_json?: string | null; url?: string | null }>;
  };

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

  const dir = path.join(process.cwd(), "public", "patterns", patternId);
  await fs.mkdir(dir, { recursive: true });

  const imagePath = `/patterns/${patternId}/hero.webp`;
  const thumbnailPath = `/patterns/${patternId}/thumb.webp`;

  await sharp(buffer)
    .resize(1200, 1200, { fit: "cover" })
    .webp({ quality: 88 })
    .toFile(path.join(process.cwd(), "public", imagePath.replace(/^\//, "")));

  await sharp(buffer)
    .resize(480, 480, { fit: "cover" })
    .webp({ quality: 80 })
    .toFile(
      path.join(process.cwd(), "public", thumbnailPath.replace(/^\//, ""))
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
