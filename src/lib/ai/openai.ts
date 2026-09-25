import OpenAI from "openai";

export function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey: key });
}

export function contentModel(): string {
  return process.env.OPENAI_CONTENT_MODEL || "gpt-4o-mini";
}

export function imageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini";
}

export function imageSize(): string {
  return process.env.OPENAI_IMAGE_SIZE || "1024x1024";
}

export function imageQuality(): string {
  return process.env.OPENAI_IMAGE_QUALITY || "high";
}
