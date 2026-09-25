import { z } from "zod";
import { getOpenAI, contentModel } from "./openai";
import type { DesignSpec, Difficulty } from "@/types";

const designSpecSchema = z.object({
  object: z.string(),
  size_cm: z.number().optional(),
  difficulty: z.enum(["beginner", "easy", "intermediate", "advanced"]),
  colors: z.array(z.string()),
  components: z.array(z.string()).min(1),
  style: z.string(),
  construction: z.string(),
  yarn_weight: z.string().optional(),
  hook_mm: z.string().optional(),
  estimated_time: z.string().optional(),
  notes: z.string().optional(),
});

export async function generateDesignSpec(prompt: string): Promise<DesignSpec> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: contentModel(),
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a professional crochet pattern designer.
Return ONLY valid JSON matching this shape:
{
  "object": "string_snake_case",
  "size_cm": number,
  "difficulty": "beginner"|"easy"|"intermediate"|"advanced",
  "colors": ["..."],
  "components": ["head","body",...],
  "style": "cute|realistic|minimal|...",
  "construction": "amigurumi|flat|in-the-round|granny|mixed",
  "yarn_weight": "DK|worsted|...",
  "hook_mm": "3.5",
  "estimated_time": "2-3 hours",
  "notes": "optional"
}
Break the project into crochet-able components. Prefer US crochet conventions.`,
      },
      {
        role: "user",
        content: `Create a design specification for this crochet project:\n\n${prompt}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  const parsed = designSpecSchema.parse(JSON.parse(raw));
  return parsed as DesignSpec;
}

export function designSpecToImagePrompt(spec: DesignSpec): string {
  const colors = spec.colors.join(", ");
  const size = spec.size_cm ? `approximately ${spec.size_cm} cm` : "small";
  return [
    `Professional product photograph of a handmade crocheted ${spec.object.replace(/_/g, " ")},`,
    `${size}, ${spec.style} style, colors: ${colors}.`,
    `Soft natural lighting, clean neutral background, sharp focus,`,
    `realistic yarn texture and visible stitches, finished crochet item ready for a pattern shop listing.`,
    `No text, no watermark, no hands.`,
  ].join(" ");
}

export function confidenceFromSpec(spec: DesignSpec): "high" | "medium" | "low" {
  const hard =
    spec.components.length > 8 ||
    spec.difficulty === "advanced" ||
    /dragon|doll|sweater|cardigan|wings/i.test(spec.object);
  if (hard) return "low";
  if (
    spec.components.length > 5 ||
    spec.difficulty === "intermediate" ||
    spec.construction === "mixed"
  ) {
    return "medium";
  }
  return "high";
}

export type { Difficulty };
