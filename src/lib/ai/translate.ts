import { getOpenAI, contentModel } from "./openai";
import type { LocalizedString, PatternContent } from "@/types";
import type { Locale } from "@/i18n/routing";

async function translateText(
  text: string,
  target: Exclude<Locale, "en">
): Promise<string> {
  if (!text.trim()) return text;
  const openai = getOpenAI();
  const lang = target === "fr" ? "French" : "Spanish";
  const completion = await openai.chat.completions.create({
    model: contentModel(),
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `Translate the user's crochet-related text into ${lang}. Keep crochet abbreviations (sc, hdc, dc, MR, inc, dec) in US English. Return only the translation.`,
      },
      { role: "user", content: text },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() || text;
}

async function fillLocalized(
  en: string,
  existing: LocalizedString
): Promise<LocalizedString> {
  const fr = existing.fr && existing.fr !== existing.en
    ? existing.fr
    : await translateText(en, "fr");
  const es = existing.es && existing.es !== existing.en
    ? existing.es
    : await translateText(en, "es");
  return { en, fr, es };
}

export async function translatePatternContent(
  content: PatternContent
): Promise<PatternContent> {
  return {
    ...content,
    title: await fillLocalized(content.title.en, content.title),
    summary: await fillLocalized(content.summary.en, content.summary),
    seoTitle: await fillLocalized(content.seoTitle.en, content.seoTitle),
    seoDescription: await fillLocalized(
      content.seoDescription.en,
      content.seoDescription
    ),
  };
}
