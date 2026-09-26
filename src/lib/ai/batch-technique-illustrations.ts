import { generateStoryboardSheet } from "@/lib/ai/generate-technique-sheet";
import { cropSheetCells } from "@/lib/crochet/crop-sheet";
import {
  applyTechniquePatches,
  listTechniques,
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
  const withImg = t.steps.filter((s) => s.imagePath).length;
  return withImg < Math.max(1, t.steps.length);
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
  const packedIds = new Set<string>();

  const sorted = [...techniques].sort((a, b) => a.sortOrder - b.sortOrder);

  function flush() {
    if (!current.length) return;
    if (sheets.length >= maxSheets) return;
    sheets.push(current);
    for (const p of current) packedIds.add(p.techniqueId);
    current = [];
  }

  for (const tech of sorted) {
    if (sheets.length >= maxSheets && current.length === 0) {
      skipped.push(tech);
      continue;
    }

    const steps = tech.steps || [];
    if (!steps.length) continue;

    const useSteps = steps.slice(0, cellsPerSheet);
    const slots: BatchPanelSlot[] = useSteps.map((s, i) => ({
      techniqueId: tech.id,
      techniqueKey: String(tech.key),
      techniqueTitle: tech.title.en || tech.slug,
      stepIndex: i,
      caption: s.caption.en || `Step ${i + 1}`,
      body: s.body.en || s.caption.en || "",
    }));

    if (current.length + slots.length > cellsPerSheet) {
      flush();
      if (sheets.length >= maxSheets) {
        skipped.push(tech);
        continue;
      }
    }

    current.push(...slots);
  }

  flush();

  for (const tech of sorted) {
    if (!packedIds.has(tech.id) && !skipped.some((s) => s.id === tech.id)) {
      skipped.push(tech);
    }
  }

  return { sheets, skipped };
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
      message:
        "Nothing to illustrate — all selected techniques already have step art.",
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
  const assignments = new Map<string, Map<number, string>>();
  /** Prefer the sheet that belongs to each technique for preview */
  const techSheetPath = new Map<string, string>();

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
      if (!techSheetPath.has(slot.techniqueId)) {
        techSheetPath.set(slot.techniqueId, sheetPath);
      }
    }
  }

  const byId = new Map(all.map((t) => [t.id, t]));
  const patches: Array<{ id: string; patch: Partial<Technique> }> = [];

  for (const [techId, stepMap] of assignments) {
    const tech = byId.get(techId);
    if (!tech) continue;
    const steps = tech.steps.map((step, i) => ({
      ...step,
      imagePath: stepMap.get(i) || step.imagePath,
    }));
    const allFilled = steps.every((s) => s.imagePath);
    patches.push({
      id: tech.id,
      patch: {
        steps,
        sheetPath: techSheetPath.get(tech.id) || sheetPaths[0],
        sheetCols: cols,
        sheetRows: rows,
        professionallyReady: allFilled,
      },
    });
  }

  const updated = await applyTechniquePatches(patches);
  const panelsFilled = [...assignments.values()].reduce(
    (n, m) => n + m.size,
    0
  );

  return {
    sheetsGenerated: sheetPaths.length,
    panelsFilled,
    techniquesUpdated: updated.length,
    techniqueIds: updated.map((t) => t.id),
    skippedTechniqueIds: skipped.map((t) => t.id),
    sheetPaths,
    message: `Generated ${sheetPaths.length} AI sheet(s) → ${panelsFilled} step images → ${updated.length} techniques updated. Open a technique marked “ready” (or the first in the list) to see step thumbnails.${
      skipped.length
        ? ` ${skipped.length} techniques still need another batch run.`
        : ""
    }`,
  };
}
