/**
 * OpenAI list prices used to estimate cost from reported usage tokens.
 * Rates are USD per 1,000,000 tokens — update if OpenAI changes pricing.
 * Sources:
 * - https://developers.openai.com/api/docs/models/gpt-5-mini
 * - https://developers.openai.com/api/docs/models/gpt-image-2.5-flare
 */

export type TokenRates = {
  textInputPerM: number;
  textCachedInputPerM: number;
  textOutputPerM: number;
  imageInputPerM: number;
  imageCachedInputPerM: number;
  imageOutputPerM: number;
};

/** Default rates matching OpenAI public docs (Sep 2026). */
export const DEFAULT_TOKEN_RATES: TokenRates = {
  // gpt-5-mini
  textInputPerM: 0.25,
  textCachedInputPerM: 0.025,
  textOutputPerM: 2.0,
  // gpt-image-2.5-flare / sunburst (same token rates)
  imageInputPerM: 8.0,
  imageCachedInputPerM: 2.0,
  imageOutputPerM: 30.0,
};

export type ChatUsageLike = {
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  total_tokens?: number | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  prompt_tokens_details?: {
    cached_tokens?: number | null;
  } | null;
  input_tokens_details?: {
    cached_tokens?: number | null;
  } | null;
};

export type ImageUsageLike = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  total_tokens?: number | null;
  input_tokens_details?: {
    text_tokens?: number | null;
    image_tokens?: number | null;
    cached_tokens_details?: {
      text_tokens?: number | null;
      image_tokens?: number | null;
    } | null;
  } | null;
  output_tokens_details?: {
    image_tokens?: number | null;
  } | null;
};

export type CostBreakdown = {
  textInputTokens: number;
  textCachedInputTokens: number;
  textOutputTokens: number;
  imageInputTokens: number;
  imageCachedInputTokens: number;
  imageOutputTokens: number;
  usd: number;
};

function perM(tokens: number, ratePerM: number): number {
  return (Math.max(0, tokens) / 1_000_000) * ratePerM;
}

export function costFromChatUsage(
  usage: ChatUsageLike | null | undefined,
  rates: TokenRates = DEFAULT_TOKEN_RATES
): CostBreakdown {
  const input =
    usage?.prompt_tokens ?? usage?.input_tokens ?? 0;
  const cached =
    usage?.prompt_tokens_details?.cached_tokens ??
    usage?.input_tokens_details?.cached_tokens ??
    0;
  const uncached = Math.max(0, input - (cached || 0));
  const output =
    usage?.completion_tokens ?? usage?.output_tokens ?? 0;

  const usd =
    perM(uncached, rates.textInputPerM) +
    perM(cached || 0, rates.textCachedInputPerM) +
    perM(output, rates.textOutputPerM);

  return {
    textInputTokens: uncached,
    textCachedInputTokens: cached || 0,
    textOutputTokens: output,
    imageInputTokens: 0,
    imageCachedInputTokens: 0,
    imageOutputTokens: 0,
    usd: roundUsd(usd),
  };
}

export function costFromImageUsage(
  usage: ImageUsageLike | null | undefined,
  rates: TokenRates = DEFAULT_TOKEN_RATES
): CostBreakdown {
  const details = usage?.input_tokens_details;
  const textIn = details?.text_tokens ?? 0;
  const imageIn = details?.image_tokens ?? 0;
  const cachedText = details?.cached_tokens_details?.text_tokens ?? 0;
  const cachedImage = details?.cached_tokens_details?.image_tokens ?? 0;

  // If details missing, treat all input_tokens as text input (prompt)
  const inputTotal = usage?.input_tokens ?? 0;
  const hasDetails = Boolean(details?.text_tokens || details?.image_tokens);
  const textInputTokens = hasDetails
    ? Math.max(0, textIn - cachedText)
    : Math.max(0, inputTotal);
  const imageInputTokens = hasDetails ? Math.max(0, imageIn - cachedImage) : 0;

  const imageOutputTokens =
    usage?.output_tokens_details?.image_tokens ?? usage?.output_tokens ?? 0;

  const usd =
    perM(textInputTokens, rates.textInputPerM) +
    perM(cachedText, rates.textCachedInputPerM) +
    perM(imageInputTokens, rates.imageInputPerM) +
    perM(cachedImage, rates.imageCachedInputPerM) +
    perM(imageOutputTokens, rates.imageOutputPerM);

  return {
    textInputTokens,
    textCachedInputTokens: cachedText,
    textOutputTokens: 0,
    imageInputTokens,
    imageCachedInputTokens: cachedImage,
    imageOutputTokens,
    usd: roundUsd(usd),
  };
}

export function sumCosts(parts: CostBreakdown[]): CostBreakdown {
  const empty: CostBreakdown = {
    textInputTokens: 0,
    textCachedInputTokens: 0,
    textOutputTokens: 0,
    imageInputTokens: 0,
    imageCachedInputTokens: 0,
    imageOutputTokens: 0,
    usd: 0,
  };
  const summed = parts.reduce(
    (a, b) => ({
      textInputTokens: a.textInputTokens + b.textInputTokens,
      textCachedInputTokens: a.textCachedInputTokens + b.textCachedInputTokens,
      textOutputTokens: a.textOutputTokens + b.textOutputTokens,
      imageInputTokens: a.imageInputTokens + b.imageInputTokens,
      imageCachedInputTokens:
        a.imageCachedInputTokens + b.imageCachedInputTokens,
      imageOutputTokens: a.imageOutputTokens + b.imageOutputTokens,
      usd: a.usd + b.usd,
    }),
    empty
  );
  return { ...summed, usd: roundUsd(summed.usd) };
}

export function roundUsd(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

export function formatUsd(n: number): string {
  if (n < 0.01) return `$${n.toFixed(6)}`;
  return `$${n.toFixed(4)}`;
}

export function ratesForModel(model: string): TokenRates {
  // Image models share Flare/Sunburst token rates
  if (/image|flare|sunburst/i.test(model)) {
    return DEFAULT_TOKEN_RATES;
  }
  // Default content rates = gpt-5-mini; other models still use these
  // until admin overrides — good enough for comparison.
  return DEFAULT_TOKEN_RATES;
}
