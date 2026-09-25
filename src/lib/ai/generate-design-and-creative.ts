import { z } from "zod";
import { getOpenAI, contentModel } from "./openai";
import type { DesignSpec } from "@/types";

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
  suggested_category_slug: z.string().optional(),
  suggested_category_name: z.string().optional(),
  suggested_category_description: z.string().optional(),
});

export async function inventCreativeSubject(): Promise<string> {
  const openai = await getOpenAI();
  const completion = await openai.chat.completions.create({
    model: await contentModel(),
    temperature: 0.95,
    messages: [
      {
        role: "system",
        content:
          "You invent original, sellable crochet project ideas. Reply with ONE short English product brief only (1–2 sentences). No quotes or labels.",
      },
      {
        role: "user",
        content:
          "Invent a cute or cozy crochet project suitable for a pattern shop (amigurumi, bag, home decor, or accessory). Be specific about size, colors, and a charming detail.",
      },
    ],
  });
  return (
    completion.choices[0]?.message?.content?.trim() ||
    "Cute 12 cm pastel bunny amigurumi with a tiny bow, beginner friendly"
  );
}

export async function generateDesignSpec(prompt: string): Promise<DesignSpec> {
  const openai = await getOpenAI();
  const completion = await openai.chat.completions.create({
    model: await contentModel(),
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a professional crochet pattern designer for a paid pattern shop.
Return ONLY valid JSON:
{
  "object": "string_snake_case",
  "size_cm": number,
  "difficulty": "beginner"|"easy"|"intermediate"|"advanced",
  "colors": ["..."],
  "components": ["head","body",...],
  "style": "cute|cozy|minimal|...",
  "construction": "amigurumi|flat|in-the-round|granny|mixed",
  "yarn_weight": "DK|worsted|...",
  "hook_mm": "3.5",
  "estimated_time": "2-3 hours",
  "notes": "optional",
  "suggested_category_slug": "amigurumi",
  "suggested_category_name": "Amigurumi",
  "suggested_category_description": "short EN description"
}
Break into crochet-able components. Prefer US crochet conventions. Category slug lowercase kebab-case.`,
      },
      {
        role: "user",
        content: `Create a design specification for this crochet project:\n\n${prompt}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  return designSpecSchema.parse(JSON.parse(raw)) as DesignSpec;
}

export function designSpecToImagePrompt(spec: DesignSpec): string {
  const colors = spec.colors.join(", ");
  const size = spec.size_cm ? `approximately ${spec.size_cm} cm` : "small";
  return [
    `Professional product photograph of a handmade crocheted ${spec.object.replace(/_/g, " ")},`,
    `${size}, ${spec.style} style, colors: ${colors}.`,
    `Soft natural lighting, clean warm cream background, sharp focus,`,
    `realistic yarn texture and visible stitches, boutique crochet shop listing photo.`,
    `No text, no watermark, no hands, no people.`,
  ].join(" ");
}

export function confidenceFromSpec(
  spec: DesignSpec
): "high" | "medium" | "low" {
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
