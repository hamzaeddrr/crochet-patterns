import { chatCompletion } from "./openai";
import type { LocalizedString, PatternContent } from "@/types";
import type { Locale } from "@/i18n/routing";

async function translateText(
  text: string,
  target: Exclude<Locale, "en">
): Promise<string> {
  if (!text.trim()) return text;
  const lang = target === "fr" ? "French" : "Spanish";
  const completion = await chatCompletion({
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
  existing: LocalizedString,
  force = false
): Promise<LocalizedString> {
  const needFr = force || !existing.fr || existing.fr === existing.en;
  const needEs = force || !existing.es || existing.es === existing.en;
  const fr = needFr ? await translateText(en, "fr") : existing.fr;
  const es = needEs ? await translateText(en, "es") : existing.es;
  return { en, fr, es };
}

export async function translatePatternContent(
  content: PatternContent,
  force = false
): Promise<PatternContent> {
  return {
    ...content,
    title: await fillLocalized(content.title.en, content.title, force),
    summary: await fillLocalized(content.summary.en, content.summary, force),
    seoTitle: await fillLocalized(content.seoTitle.en, content.seoTitle, force),
    seoDescription: await fillLocalized(
      content.seoDescription.en,
      content.seoDescription,
      force
    ),
  };
}

export async function translateLocalizedField(
  en: string
): Promise<LocalizedString> {
  return fillLocalized(en, { en, fr: en, es: en }, true);
}
