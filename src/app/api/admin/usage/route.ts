import { NextResponse } from "next/server";
import {
  groupUsageByRun,
  listAiUsage,
} from "@/lib/ai/usage-log";
import {
  DEFAULT_TOKEN_RATES,
  formatUsd,
  sumCosts,
} from "@/lib/ai/pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await listAiUsage(400);
  const runs = groupUsageByRun(entries);
  const totals = sumCosts(entries.map((e) => e.cost));
  const chatUsd = entries
    .filter((e) => e.kind === "chat")
    .reduce((s, e) => s + e.cost.usd, 0);
  const imageUsd = entries
    .filter((e) => e.kind === "image")
    .reduce((s, e) => s + e.cost.usd, 0);

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const todayEntries = entries.filter(
    (e) => Date.parse(e.createdAt) >= dayAgo
  );
  const todayTotals = sumCosts(todayEntries.map((e) => e.cost));

  return NextResponse.json({
    rates: DEFAULT_TOKEN_RATES,
    ratesNote:
      "Estimates from OpenAI public list prices (USD / 1M tokens). Compare with your OpenAI usage dashboard.",
    summary: {
      allTimeUsd: totals.usd,
      allTimeFormatted: formatUsd(totals.usd),
      chatUsd: Math.round(chatUsd * 1e6) / 1e6,
      imageUsd: Math.round(imageUsd * 1e6) / 1e6,
      todayUsd: todayTotals.usd,
      todayFormatted: formatUsd(todayTotals.usd),
      entryCount: entries.length,
      runCount: runs.length,
      tokens: {
        textInput: totals.textInputTokens,
        textOutput: totals.textOutputTokens,
        imageInput: totals.imageInputTokens,
        imageOutput: totals.imageOutputTokens,
      },
    },
    runs,
    entries: entries.slice(0, 100),
  });
}
