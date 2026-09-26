import OpenAI from "openai";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";
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

/**
 * GPT-5 / o-series reasoning models only accept the default temperature (1).
 * Passing 0.2, 0.95, etc. returns HTTP 400.
 * Same restriction for top_p, presence_penalty, frequency_penalty.
 */
export function isFixedSamplingModel(model: string): boolean {
  const m = model.toLowerCase();
  return (
    m.startsWith("gpt-5") ||
    m.startsWith("o1") ||
    m.startsWith("o3") ||
    m.startsWith("o4")
  );
}

type ChatParams = Omit<ChatCompletionCreateParamsNonStreaming, "model"> & {
  model?: string;
  temperature?: number;
};

/**
 * Build chat.completions params safe for the active content model.
 * Omits temperature / sampling knobs when the model rejects non-defaults.
 */
export async function buildChatParams(
  params: ChatParams
): Promise<ChatCompletionCreateParamsNonStreaming> {
  const model = params.model || (await contentModel());
  const {
    temperature: _t,
    top_p: _topP,
    presence_penalty: _pp,
    frequency_penalty: _fp,
    ...rest
  } = params as ChatParams & {
    top_p?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
  };

  const base: ChatCompletionCreateParamsNonStreaming = {
    ...rest,
    model,
    messages: params.messages,
  };

  if (!isFixedSamplingModel(model) && typeof params.temperature === "number") {
    base.temperature = params.temperature;
  }

  return base;
}

export async function chatCompletion(
  params: ChatParams & { usageLabel?: string }
) {
  const openai = await getOpenAI();
  const { usageLabel, ...chatParams } = params;
  const built = await buildChatParams(chatParams);
  const completion = await openai.chat.completions.create(built);
  try {
    const { logChatUsage } = await import("@/lib/ai/usage-log");
    await logChatUsage({
      model: built.model,
      label: usageLabel || "chat",
      usage: completion.usage || null,
    });
  } catch (err) {
    console.warn("chat usage log skipped:", err);
  }
  return completion;
}
