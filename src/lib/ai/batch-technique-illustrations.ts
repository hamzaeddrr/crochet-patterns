import { generateStoryboardSheet } from "@/lib/ai/generate-technique-sheet";
import { cropSheetCells } from "@/lib/crochet/crop-sheet";
import {
  listTechniques,
  upsertTechnique,
} from "@/lib/data/techniques-store";
import type { Technique } from "@/types/techniques";

export interface BatchPanelSlot {
  techniqueId: string;
  techniqueKey: string;
  techniqueTitle: string;
  stepIndex: number;
  caption: string;
  body: string;
}

export interface BatchIllustrateResult {
  sheetsGenerated: number;
  panelsFilled: number;
  techniquesUpdated: number;
  techniqueIds: string[];
  skippedTechniqueIds: string[];
  sheetPaths: string[];
  message: string;
}

function needsArt(t: Technique): boolean {
  if (t.professionallyReady || t.technicallyApproved) {
    const filled = t.steps.filter((s) => s.imagePath).length;
    return filled < t.steps.length;
  }
  return t.steps.some((s) => !s.imagePath);
}

/** Pack whole techniques into sheets (don't split a technique across sheets). */
export function packTechniquesIntoSheets(
  techniques: Technique[],
  cellsPerSheet: number,
  maxSheets: number
): { sheets: BatchPanelSlot[][]; skipped: Technique[] } {
  const sheets: BatchPanelSlot[][] = [];
  let current: BatchPanelSlot[] = [];
  const skipped: Technique[] = [];

  const sorted = [...techniques].sort((a, b) => a.sortOrder - b.sortOrder);

  for (const tech of sorted) {
    const steps = tech.steps || [];
    if (!steps.length) continue;
    if (steps.length > cellsPerSheet) {
      // Too many steps for one sheet — take first cellsPerSheet
      const slots: BatchPanelSlot[] = steps
        .slice(0, cellsPerSheet)
        .map((s, i) => ({
          techniqueId: tech.id,
          techniqueKey: String(tech.key),
          techniqueTitle: tech.title.en || tech.slug,
          stepIndex: i,
          caption: s.caption.en || `Step ${i + 1}`,
          body: s.body.en || s.caption.en || "",
        }));
      if (current.length > 0) {
        sheets.push(current);
        current = [];
        if (sheets.length >= maxSheets) {
          skipped.push(tech);
          continue;
        }
      }
      sheets.push(slots);
      if (sheets.length >= maxSheets) {
        // remaining techniques skipped
        const rest = sorted.slice(sorted.indexOf(tech) + 1);
        skipped.push(...rest);
        break;
      }
      continue;
    }

    if (current.length + steps.length > cellsPerSheet) {
      sheets.push(current);
      current = [];
      if (sheets.length >= maxSheets) {
        skipped.push(tech);
        const rest = sorted.slice(sorted.indexOf(tech) + 1);
        skipped.push(...rest);
        break;
      }
    }

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      current.push({
        techniqueId: tech.id,
        techniqueKey: String(tech.key),
        techniqueTitle: tech.title.en || tech.slug,
        stepIndex: i,
        caption: s.caption.en || `Step ${i + 1}`,
        body: s.body.en || s.caption.en || "",
      });
    }
  }

  if (current.length > 0 && sheets.length < maxSheets) {
    sheets.push(current);
  } else if (current.length > 0) {
    // leftover techniques in current that didn't fit
    const ids = new Set(current.map((p) => p.techniqueId));
    for (const tech of sorted) {
      if (ids.has(tech.id) && !skipped.includes(tech)) skipped.push(tech);
    }
  }

  return { sheets: sheets.slice(0, maxSheets), skipped };
}

function buildBatchSheetPrompt(
  panels: BatchPanelSlot[],
  cols: number,
  rows: number
): string {
  const panelBlock = panels
    .map((p, i) => {
      const row = Math.floor(i / cols) + 1;
      const col = (i % cols) + 1;
      return [
        `Panel ${i + 1} (row ${row}, col ${col}): Technique "${p.techniqueTitle}" — Step ${p.stepIndex + 1}: ${p.caption}`,
        `Action: ${p.body}`,
        `MUST: clear hook entry, correct loops on hook, readable yarn path, real crochet stitch anatomy.`,
      ].join("\n");
    })
    .join("\n\n");

  const empty = cols * rows - panels.length;

  return [
    `Create ONE single Loopcraft crochet tutorial storyboard sheet covering MULTIPLE techniques.`,
    `Layout: exact ${cols} columns × ${rows} rows equal panels, thin cream (#faf7f2) dividers.`,
    `Fill panels left→right, top→bottom in order. ${empty > 0 ? `Leave the last ${empty} panel(s) as plain cream empty cells.` : "Fill every cell."}`,
    `Style: polished flat vector yarn-brand diagrams, peach/apricot yarn (#d96b52), silver hook with clear tip/throat, simplified hands, consistent camera angle, soft lighting.`,
    `CRITICAL: no letters, numbers, watermarks, logos, or captions in the image.`,
    `Each panel is an independent crochet motion for its labeled technique/step:`,
    panelBlock,
  ].join("\n");
}

/**
 * Cost-saving batch: pack many techniques into 1–3 AI sheets, crop, assign steps.
 */
export async function batchIllustrateTechniques(opts?: {
  maxSheets?: number;
  cols?: number;
  rows?: number;
  onlyMissing?: boolean;
  techniqueIds?: string[];
}): Promise<BatchIllustrateResult> {
  const maxSheets = Math.max(1, Math.min(3, opts?.maxSheets ?? 3));
  // Dense but readable on 1536×1024
  const cols = Math.max(2, Math.min(5, opts?.cols ?? 4));
  const rows = Math.max(2, Math.min(4, opts?.rows ?? 3));
  const cells = cols * rows;

  let all = await listTechniques();
  if (opts?.techniqueIds?.length) {
    const set = new Set(opts.techniqueIds);
    all = all.filter((t) => set.has(t.id));
  } else if (opts?.onlyMissing !== false) {
    all = all.filter(needsArt);
  }

  if (!all.length) {
    return {
      sheetsGenerated: 0,
      panelsFilled: 0,
      techniquesUpdated: 0,
      techniqueIds: [],
      skippedTechniqueIds: [],
      sheetPaths: [],
      message: "Nothing to illustrate — all selected techniques already have step art.",
    };
  }

  const { sheets, skipped } = packTechniquesIntoSheets(all, cells, maxSheets);
  if (!sheets.length) {
    return {
      sheetsGenerated: 0,
      panelsFilled: 0,
      techniquesUpdated: 0,
      techniqueIds: [],
      skippedTechniqueIds: skipped.map((t) => t.id),
      sheetPaths: [],
      message: "Could not pack any techniques into sheets.",
    };
  }

  const batchId = Date.now();
  const sheetPaths: string[] = [];
  /** techniqueId → stepIndex → imagePath */
  const assignments = new Map<string, Map<number, string>>();

  for (let s = 0; s < sheets.length; s++) {
    const panels = sheets[s];
    const prompt = buildBatchSheetPrompt(panels, cols, rows);
    const { sheetPath } = await generateStoryboardSheet({
      prompt,
      assetPath: `techniques/batch/${batchId}/sheet-${s + 1}.webp`,
      usageLabel: "technique-batch-sheet",
      patternId: `batch-${batchId}`,
    });
    sheetPaths.push(sheetPath);

    const crops = await cropSheetCells({
      sheetPath,
      cols,
      rows,
      count: panels.length,
      pathForIndex: (i, stamp) =>
        `techniques/batch/${batchId}/s${s + 1}-p${i + 1}-${stamp}.webp`,
    });

    for (let i = 0; i < panels.length; i++) {
      const slot = panels[i];
      const path = crops[i];
      if (!path) continue;
      if (!assignments.has(slot.techniqueId)) {
        assignments.set(slot.techniqueId, new Map());
      }
      assignments.get(slot.techniqueId)!.set(slot.stepIndex, path);
    }
  }

  const updatedIds: string[] = [];
  for (const [techId, stepMap] of assignments) {
    const tech = all.find((t) => t.id === techId);
    if (!tech) continue;
    const steps = tech.steps.map((step, i) => ({
      ...step,
      imagePath: stepMap.get(i) || step.imagePath,
    }));
    const allFilled = steps.every((s) => s.imagePath);
    await upsertTechnique({
      ...tech,
      id: tech.id,
      steps,
      sheetPath: sheetPaths[0],
      sheetCols: cols,
      sheetRows: rows,
      professionallyReady: allFilled,
    });
    updatedIds.push(tech.id);
  }

  const panelsFilled = [...assignments.values()].reduce(
    (n, m) => n + m.size,
    0
  );

  return {
    sheetsGenerated: sheetPaths.length,
    panelsFilled,
    techniquesUpdated: updatedIds.length,
    techniqueIds: updatedIds,
    skippedTechniqueIds: skipped.map((t) => t.id),
    sheetPaths,
    message: `Generated ${sheetPaths.length} AI sheet(s) → ${panelsFilled} step panels → ${updatedIds.length} techniques updated${
      skipped.length
        ? ` (${skipped.length} left for another batch run)`
        : ""
    }.`,
  };
}
