import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { getOpenAI, imageModel, imageQuality, imageSize } from "./openai";
import { designSpecToImagePrompt } from "./design-spec";
import type { DesignSpec } from "@/types";

export interface GeneratedImagePaths {
  imagePath: string;
  thumbnailPath: string;
  promptUsed: string;
}

export async function generatePatternImage(
  patternId: string,
  spec: DesignSpec,
  customPrompt?: string
): Promise<GeneratedImagePaths> {
  const openai = getOpenAI();
  const promptUsed = customPrompt?.trim() || designSpecToImagePrompt(spec);

  const result = await openai.images.generate({
    model: imageModel(),
    prompt: promptUsed,
    size: imageSize() as "1024x1024",
    quality: imageQuality() as "high",
  });

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

  return { imagePath, thumbnailPath, promptUsed };
}
