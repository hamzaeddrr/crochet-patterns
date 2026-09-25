import OpenAI from "openai";
import {
  resolveContentModel,
  resolveOpenAiApiKey,
} from "@/lib/admin/settings-store";

export async function getOpenAI(): Promise<OpenAI> {
  const apiKey = await resolveOpenAiApiKey();
  return new OpenAI({ apiKey });
}

export async function contentModel(): Promise<string> {
  return resolveContentModel();
}

/** @deprecated use async contentModel() */
export function contentModelSync(): string {
  return process.env.OPENAI_CONTENT_MODEL || "gpt-5-mini";
}

export function imageModelSync(): string {
  return process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare";
}
