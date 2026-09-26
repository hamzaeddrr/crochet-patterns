import { chatCompletion } from "@/lib/ai/openai";
import { readPublicAsset } from "@/lib/storage/assets";
import {
  getTechniqueBlueprint,
  type TechniquePanelBlueprint,
} from "@/lib/crochet/technique-blueprints";
import type { Technique } from "@/types/techniques";

export interface PanelQaResult {
  stepIndex: number;
  pass: boolean;
  score: number;
  failures: string[];
  notes: string;
}

export interface TechniqueQaReport {
  pass: boolean;
  averageScore: number;
  panels: PanelQaResult[];
  checkedAt: string;
}

function bufferToDataUrl(buf: Buffer, mime = "image/webp"): string {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function qaOnePanel(opts: {
  techniqueTitle: string;
  stepIndex: number;
  caption: string;
  body: string;
  blueprint?: TechniquePanelBlueprint;
  imagePath: string;
}): Promise<PanelQaResult> {
  const buf = await readPublicAsset(opts.imagePath);
  const dataUrl = bufferToDataUrl(buf);

  const must = opts.blueprint?.mustShow?.join("\n- ") || "Clear crochet action matching the caption";
  const reject =
    opts.blueprint?.rejectIf?.join("\n- ") ||
    "Impossible hand poses; wrong loop count; unreadable hook";

  const completion = await chatCompletion({
    usageLabel: "technique-panel-qa",
    // Vision-capable judge — override content model if it can't see images
    model: process.env.OPENAI_QA_MODEL || "gpt-4o",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You are a strict crochet technical illustrator QA reviewer.",
          "Judge ONLY crochet correctness of the illustration for beginners.",
          "Fail if hook entry, yarn strand, loop count on hook, stitch anatomy, hand feasibility, or yarn path is wrong or unreadable.",
          "Return JSON: { pass: boolean, score: number 0-100, failures: string[], notes: string }",
          "pass requires score >= 75 and zero critical failures about hook/loops/yarn path.",
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
              `Reject if:\n- ${reject}`,
              "Score this panel.",
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
  let parsed: {
    pass?: boolean;
    score?: number;
    failures?: string[];
    notes?: string;
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { pass: false, score: 0, failures: ["QA JSON parse failed"], notes: raw.slice(0, 200) };
  }

  const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
  const failures = Array.isArray(parsed.failures)
    ? parsed.failures.map(String)
    : [];
  const pass = Boolean(parsed.pass) && score >= 75 && failures.length === 0;

  return {
    stepIndex: opts.stepIndex,
    pass,
    score,
    failures: pass ? [] : failures.length ? failures : ["Failed technical QA"],
    notes: String(parsed.notes || ""),
  };
}

/** Vision-QA all step images for a technique. */
export async function qaTechniquePanels(
  technique: Technique
): Promise<TechniqueQaReport> {
  const bp = getTechniqueBlueprint(String(technique.key));
  const panels: PanelQaResult[] = [];

  for (let i = 0; i < technique.steps.length; i++) {
    const step = technique.steps[i];
    if (!step.imagePath) {
      panels.push({
        stepIndex: i,
        pass: false,
        score: 0,
        failures: ["Missing step image"],
        notes: "",
      });
      continue;
    }
    try {
      const result = await qaOnePanel({
        techniqueTitle: technique.title.en || technique.slug,
        stepIndex: i,
        caption: step.caption.en || "",
        body: step.body.en || "",
        blueprint: bp?.panels[i],
        imagePath: step.imagePath,
      });
      panels.push(result);
    } catch (err) {
      panels.push({
        stepIndex: i,
        pass: false,
        score: 0,
        failures: [
          err instanceof Error ? err.message : "QA request failed",
        ],
        notes: "",
      });
    }
  }

  const averageScore =
    panels.length === 0
      ? 0
      : panels.reduce((s, p) => s + p.score, 0) / panels.length;
  const pass = panels.length > 0 && panels.every((p) => p.pass);

  return {
    pass,
    averageScore: Math.round(averageScore),
    panels,
    checkedAt: new Date().toISOString(),
  };
}
