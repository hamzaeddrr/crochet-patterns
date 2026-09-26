import { chatCompletion } from "@/lib/ai/openai";
import { emptyLocalized } from "@/types";
import type { Technique, TechniqueStep } from "@/types/techniques";

interface GeneratedStep {
  captionEn: string;
  captionFr: string;
  captionEs: string;
  bodyEn: string;
  bodyFr: string;
  bodyEs: string;
}

/**
 * Turn pasted reference notes into clear beginner tutorial steps (EN/FR/ES).
 * Does not invent brand art or copy third-party images — text only.
 */
export async function generateTechniqueStepsFromReference(opts: {
  title: string;
  tip?: string;
  referenceText: string;
}): Promise<TechniqueStep[]> {
  const reference = opts.referenceText.trim();
  if (!reference) {
    throw new Error("Paste or write reference text first");
  }

  const completion = await chatCompletion({
    usageLabel: "technique-steps-from-reference",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You write beginner crochet tutorial steps for Loopcraft (US crochet terms).",
          "Use the user's reference notes as the source of truth for sequence and technique.",
          "Rewrite into clear original Loopcraft wording — do not copy verbatim long passages.",
          "Each step is ONE motion a beginner can follow (not filler like “continue”).",
          "Include FR and ES translations for every caption and body.",
          "Keep stitch abbreviations (sc, hdc, dc, ch, MR, etc.) in US English in all locales.",
          "Return JSON only: { steps: Array<{ captionEn, captionFr, captionEs, bodyEn, bodyFr, bodyEs }> }",
          "Aim for 3–8 steps unless the reference clearly needs more or fewer.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          `Technique title: ${opts.title}`,
          opts.tip ? `Tip: ${opts.tip}` : "",
          "Reference notes:",
          reference,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  let parsed: { steps?: GeneratedStep[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("AI returned invalid step JSON — try again");
  }

  const list = Array.isArray(parsed.steps) ? parsed.steps : [];
  if (!list.length) {
    throw new Error("AI returned no steps — add more detail to the reference");
  }

  return list.map((s) => ({
    caption: {
      en: (s.captionEn || "").trim() || "Step",
      fr: (s.captionFr || s.captionEn || "").trim() || "Étape",
      es: (s.captionEs || s.captionEn || "").trim() || "Paso",
    },
    body: {
      en: (s.bodyEn || "").trim(),
      fr: (s.bodyFr || s.bodyEn || "").trim(),
      es: (s.bodyEs || s.bodyEn || "").trim(),
    },
  }));
}

export async function applyGeneratedStepsToTechnique(
  technique: Technique,
  referenceText: string
): Promise<Technique> {
  const steps = await generateTechniqueStepsFromReference({
    title: technique.title.en || technique.slug,
    tip: technique.tip.en,
    referenceText,
  });

  // Prefer emptyLocalized only if somehow empty — steps already localized.
  if (!steps.length) {
    return {
      ...technique,
      referenceText,
      steps: [
        {
          caption: emptyLocalized("Step 1"),
          body: emptyLocalized(""),
        },
      ],
    };
  }

  return {
    ...technique,
    referenceText,
    steps,
    professionallyReady: false,
    technicallyApproved: false,
  };
}
