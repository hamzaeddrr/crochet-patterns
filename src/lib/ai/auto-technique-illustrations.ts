import { generateTechniqueSheet } from "@/lib/ai/generate-technique-sheet";
import { qaTechniquePanels } from "@/lib/ai/qa-technique-panels";
import { cropSheetToStepImages } from "@/lib/crochet/crop-sheet";
import { getTechniqueBlueprint } from "@/lib/crochet/technique-blueprints";
import { upsertTechnique } from "@/lib/data/techniques-store";
import type { Technique, TechniqueQaReport } from "@/types/techniques";

export interface AutoIllustrateResult {
  technique: Technique;
  attempts: number;
  approved: boolean;
  qa: TechniqueQaReport | null;
  sheetPath?: string;
  model?: string;
  promptUsed?: string;
  message: string;
}

/**
 * Fully automatic: generate storyboard → crop → vision QA → regenerate until pass
 * (or maxAttempts). Marks technique.technicallyApproved when QA passes.
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
  let lastQa: TechniqueQaReport | null = null;
  let lastSheet = technique.sheetPath;
  let lastModel = "";
  let lastPrompt = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const feedback =
      lastQa && !lastQa.pass
        ? [
            "Previous attempt FAILED technical QA. Fix these issues:",
            ...lastQa.panels
              .filter((p) => !p.pass)
              .flatMap((p) =>
                p.failures.map((f) => `Panel ${p.stepIndex + 1}: ${f}`)
              ),
          ].join("\n")
        : "";

    const { sheetPath, promptUsed, model } = await generateTechniqueSheet(
      current,
      {
        cols,
        rows,
        qaFeedback: feedback || undefined,
      }
    );
    lastSheet = sheetPath;
    lastModel = model;
    lastPrompt = promptUsed;

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
      technicallyApproved: false,
      qaReport: undefined,
    });

    const qa = await qaTechniquePanels(current);
    lastQa = qa;

    if (qa.pass) {
      current = await upsertTechnique({
        ...current,
        id: current.id,
        technicallyApproved: true,
        qaReport: qa,
      });
      return {
        technique: current,
        attempts: attempt,
        approved: true,
        qa,
        sheetPath,
        model,
        promptUsed,
        message: `Approved after ${attempt} attempt(s) — avg QA ${qa.averageScore}/100`,
      };
    }
  }

  current = await upsertTechnique({
    ...current,
    id: current.id,
    technicallyApproved: false,
    qaReport: lastQa || undefined,
  });

  return {
    technique: current,
    attempts: maxAttempts,
    approved: false,
    qa: lastQa,
    sheetPath: lastSheet,
    model: lastModel,
    promptUsed: lastPrompt,
    message: lastQa
      ? `Not approved after ${maxAttempts} attempts (avg ${lastQa.averageScore}/100). Latest failures kept for review.`
      : `Not approved after ${maxAttempts} attempts.`,
  };
}
