import { z } from "zod";
import { chatCompletion } from "./openai";
import type { DesignSpec, PatternContent } from "@/types";

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
  const completion = await chatCompletion({
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
  const completion = await chatCompletion({
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

/** Build an image prompt from the finished pattern (not just the design brief). */
export function patternContentToImagePrompt(
  spec: DesignSpec,
  content: PatternContent
): string {
  const title = content.title.en || spec.object.replace(/_/g, " ");
  const summary = (content.summary.en || "").slice(0, 220);
  const colors = spec.colors.length
    ? spec.colors.join(", ")
    : "yarn colors matching the materials list";
  const size = spec.size_cm ? `about ${spec.size_cm} cm` : "pattern size";
  const yarn = content.materials.yarn.slice(0, 4).join("; ") || "soft yarn";
  const hook = content.materials.hook || spec.hook_mm || "crochet hook";

  const stages = pickPatternStages(content, spec);
  const stageLines = stages
    .map((s, i) => `Panel ${i + 1}: ${s}`)
    .join("\n");

  return [
    `Create ONE professional crochet-pattern marketing image as a clean multi-panel storyboard collage (3 or 4 panels in a neat grid or horizontal strip).`,
    `The artwork must match THIS exact written pattern — not a generic toy.`,
    ``,
    `Pattern title: ${title}.`,
    `Finished look: crocheted ${spec.object.replace(/_/g, " ")}, ${size}, ${spec.style} style, construction ${spec.construction}.`,
    summary ? `Pattern summary: ${summary}` : "",
    `Yarn / materials: ${yarn}. Hook: ${hook}. Colors: ${colors}.`,
    ``,
    `Show these real stages from the pattern (left-to-right or numbered panels):`,
    stageLines,
    ``,
    `Final panel MUST be the completed finished piece matching the pattern title and colors.`,
    `Earlier panels show in-progress crochet pieces for the named parts (visible stitches, correct yarn colors, circular amigurumi or flat fabric as appropriate).`,
    `Soft natural studio lighting, warm cream / linen background, realistic yarn texture, boutique craft-shop quality.`,
    `No readable text, no logos, no watermarks, no people, no hands.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function pickPatternStages(
  content: PatternContent,
  spec: DesignSpec
): string[] {
  const stages: string[] = [];
  const comps = content.components.slice(0, 4);

  for (const c of comps) {
    const rounds = c.rounds || [];
    const first = rounds[0];
    const mid = rounds[Math.floor(rounds.length / 2)];
    const name = c.name || c.id;
    const make = c.make && c.make > 1 ? ` (make ${c.make})` : "";

    if (stages.length === 0 && first) {
      stages.push(
        `Start of "${name}"${make}: early rounds / foundation (${first.instructions.slice(0, 100)}), yarn matching the pattern`
      );
    } else if (mid) {
      stages.push(
        `In-progress "${name}"${make}: mid construction (${mid.instructions.slice(0, 90)}), stitch texture clear`
      );
    } else {
      stages.push(`Crocheted part "${name}"${make} as described in the pattern`);
    }
    if (stages.length >= 3) break;
  }

  if (content.assembly?.length) {
    stages.push(
      `Assembly stage: ${content.assembly[0].slice(0, 120)}`
    );
  }

  stages.push(
    `Finished ${spec.object.replace(/_/g, " ")}: complete polished product photo matching title, colors (${spec.colors.join(", ") || "pattern colors"}), and style ${spec.style}`
  );

  // Keep 3–4 panels max for a readable collage
  if (stages.length > 4) {
    return [stages[0], stages[1], stages[stages.length - 2], stages[stages.length - 1]];
  }
  return stages;
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
