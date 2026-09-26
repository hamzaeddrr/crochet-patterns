import { generateTechniqueSheet } from "@/lib/ai/generate-technique-sheet";
import { reviewTechniquePanels } from "@/lib/ai/qa-technique-panels";
import { cropSheetToStepImages } from "@/lib/crochet/crop-sheet";
import { getTechniqueBlueprint } from "@/lib/crochet/technique-blueprints";
import { upsertTechnique } from "@/lib/data/techniques-store";
import type { Technique } from "@/types/techniques";
import type { TechniqueRefineReport } from "@/lib/ai/qa-technique-panels";

export interface AutoIllustrateResult {
  technique: Technique;
  attempts: number;
  ready: boolean;
  sheetPath?: string;
  model?: string;
  message: string;
}

/**
 * Automatic professional illustrations:
 * generate → crop → silent technical review → redraw with fixes until ready
 * (or keep the best final set after maxAttempts).
 */
export async function autoIllustrateTechnique(
  technique: Technique,
  opts?: { maxAttempts?: number; cols?: number; rows?: number }
): Promise<AutoIllustrateResult> {
  const bp = getTechniqueBlueprint(String(technique.key));
  const cols = opts?.cols || bp?.preferredCols || technique.sheetCols || 2;
  const rows = opts?.rows || bp?.preferredRows || technique.sheetRows || 2;
  const maxAttempts = Math.max(1, Math.min(4, opts?.maxAttempts ?? 3));

  let current = technique;
  let lastReview: TechniqueRefineReport | null = null;
  let lastSheet = technique.sheetPath;
  let lastModel = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const feedback =
      lastReview && !lastReview.ok
        ? [
            "Improve these panels for a professional yarn-brand tutorial:",
            ...lastReview.panels
              .filter((p) => !p.ok)
              .flatMap((p) =>
                p.fixes.map((f) => `Panel ${p.stepIndex + 1}: ${f}`)
              ),
          ].join("\n")
        : "";

    const { sheetPath, model } = await generateTechniqueSheet(current, {
      cols,
      rows,
      qaFeedback: feedback || undefined,
    });
    lastSheet = sheetPath;
    lastModel = model;

    const paths = await cropSheetToStepImages({
      techniqueId: current.id,
      sheetPath,
      cols,
      rows,
      stepCount: current.steps.length,
    });

    const steps = current.steps.map((step, i) => ({
      ...step,
      imagePath: paths[i] || step.imagePath,
    }));

    current = await upsertTechnique({
      ...current,
      id: current.id,
      sheetPath,
      sheetCols: cols,
      sheetRows: rows,
      steps,
      professionallyReady: false,
    });

    const review = await reviewTechniquePanels(current);
    lastReview = review;

    if (review.ok) {
      current = await upsertTechnique({
        ...current,
        id: current.id,
        professionallyReady: true,
      });
      return {
        technique: current,
        attempts: attempt,
        ready: true,
        sheetPath,
        model,
        message:
          attempt === 1
            ? "Professional illustrations ready"
            : `Professional illustrations ready (refined ${attempt}×)`,
      };
    }
  }

  // Always ship the last set — no scorecard; user gets usable art
  current = await upsertTechnique({
    ...current,
    id: current.id,
    professionallyReady: true,
  });

  return {
    technique: current,
    attempts: maxAttempts,
    ready: true,
    sheetPath: lastSheet,
    model: lastModel,
    message: `Professional illustrations ready after ${maxAttempts} refine passes`,
  };
}
