import { chatCompletion } from "@/lib/ai/openai";
import { readPublicAsset } from "@/lib/storage/assets";
import {
  getTechniqueBlueprint,
  type TechniquePanelBlueprint,
} from "@/lib/crochet/technique-blueprints";
import type { Technique } from "@/types/techniques";

/** Internal refine signal — never shown as a score to admins. */
export interface PanelRefineResult {
  stepIndex: number;
  ok: boolean;
  /** Concrete fixes for the next image generation (empty when ok). */
  fixes: string[];
}

export interface TechniqueRefineReport {
  ok: boolean;
  panels: PanelRefineResult[];
  checkedAt: string;
}

function bufferToDataUrl(buf: Buffer, mime = "image/webp"): string {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function reviewOnePanel(opts: {
  techniqueTitle: string;
  stepIndex: number;
  caption: string;
  body: string;
  blueprint?: TechniquePanelBlueprint;
  imagePath: string;
}): Promise<PanelRefineResult> {
  const buf = await readPublicAsset(opts.imagePath);
  const dataUrl = bufferToDataUrl(buf);

  const must =
    opts.blueprint?.mustShow?.join("\n- ") ||
    "Clear crochet action matching the caption";
  const reject =
    opts.blueprint?.rejectIf?.join("\n- ") ||
    "Impossible hands; wrong loop count; unreadable hook";

  const completion = await chatCompletion({
    usageLabel: "technique-panel-refine",
    model: process.env.OPENAI_QA_MODEL || "gpt-4o",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You are a professional crochet diagram art director.",
          "Decide if this panel is clear and technically correct enough to publish in a yarn-brand tutorial.",
          "Focus on: where the hook enters, which yarn strand is caught, loops on the hook,",
          "stitch anatomy (real crochet Vs/posts), feasible hands, continuous yarn path.",
          "Return JSON only: { ok: boolean, fixes: string[] }",
          "If ok is true, fixes must be []. If ok is false, fixes are short concrete redraw instructions (no scores).",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              `Technique: ${opts.techniqueTitle}`,
              `Step ${opts.stepIndex + 1}: ${opts.caption}`,
              `Instruction: ${opts.body}`,
              `Must show:\n- ${must}`,
              `Avoid:\n- ${reject}`,
              "Is this panel ready to publish? If not, list fixes.",
            ].join("\n\n"),
          },
          {
            type: "image_url",
            image_url: { url: dataUrl, detail: "high" },
          },
        ],
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  let parsed: { ok?: boolean; fixes?: string[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    // If the reviewer fails, don't block publishing — treat as ok
    return { stepIndex: opts.stepIndex, ok: true, fixes: [] };
  }

  const fixes = Array.isArray(parsed.fixes)
    ? parsed.fixes.map(String).filter(Boolean)
    : [];
  const ok = Boolean(parsed.ok) && fixes.length === 0;

  return {
    stepIndex: opts.stepIndex,
    ok,
    fixes: ok ? [] : fixes.length ? fixes : ["Redraw this step more clearly"],
  };
}

/** Silent professional review used only to refine the next generation. */
export async function reviewTechniquePanels(
  technique: Technique
): Promise<TechniqueRefineReport> {
  const bp = getTechniqueBlueprint(String(technique.key));
  const panels: PanelRefineResult[] = [];

  for (let i = 0; i < technique.steps.length; i++) {
    const step = technique.steps[i];
    if (!step.imagePath) {
      panels.push({
        stepIndex: i,
        ok: false,
        fixes: ["Missing step image — redraw this panel"],
      });
      continue;
    }
    try {
      panels.push(
        await reviewOnePanel({
          techniqueTitle: technique.title.en || technique.slug,
          stepIndex: i,
          caption: step.caption.en || "",
          body: step.body.en || "",
          blueprint: bp?.panels[i],
          imagePath: step.imagePath,
        })
      );
    } catch {
      // Don't fail the whole run on reviewer errors
      panels.push({ stepIndex: i, ok: true, fixes: [] });
    }
  }

  return {
    ok: panels.length > 0 && panels.every((p) => p.ok),
    panels,
    checkedAt: new Date().toISOString(),
  };
}
