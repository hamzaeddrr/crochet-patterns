import {
  buildDefaultTechniques,
  mergeCatalogIntoTechniques,
} from "@/lib/crochet/technique-catalog";
import { randomUUID } from "crypto";
import { readJsonDocument, writeJsonDocument } from "@/lib/storage/json-store";
import { emptyLocalized } from "@/types";
import type {
  Technique,
  TechniquePublic,
  TechniquesDocument,
} from "@/types/techniques";

const DOC = "techniques";
const CURRENT_VERSION = 2 as const;

function emptyDoc(): TechniquesDocument {
  return { version: CURRENT_VERSION, techniques: buildDefaultTechniques() };
}

/**
 * v2: wipe steps/images and force draft so techniques can be rebuilt
 * from pasted reference text + manual photos.
 */
function migrateToCurrent(doc: TechniquesDocument): {
  doc: TechniquesDocument;
  changed: boolean;
} {
  const version = doc.version ?? 1;
  if (version >= CURRENT_VERSION) {
    return { doc: { ...doc, version: CURRENT_VERSION }, changed: false };
  }

  const now = new Date().toISOString();
  return {
    changed: true,
    doc: {
      version: CURRENT_VERSION,
      techniques: (doc.techniques || []).map((t) => ({
        ...t,
        published: false,
        professionallyReady: false,
        technicallyApproved: false,
        referenceText: t.referenceText || "",
        sheetPath: undefined,
        steps: [],
        bonusImages: [],
        updatedAt: now,
      })),
    },
  };
}

export async function readTechniquesDoc(): Promise<TechniquesDocument> {
  const raw = await readJsonDocument<TechniquesDocument>(DOC, emptyDoc());
  if (!raw.techniques?.length) return emptyDoc();

  const { doc: migrated, changed: migratedChanged } = migrateToCurrent(raw);
  const merged = mergeCatalogIntoTechniques(migrated.techniques);
  const lengthChanged = merged.length !== migrated.techniques.length;
  const next: TechniquesDocument = {
    version: CURRENT_VERSION,
    techniques: merged,
  };

  if (migratedChanged || lengthChanged) {
    try {
      await writeJsonDocument(DOC, next);
    } catch (err) {
      console.warn("techniques migrate/merge persist skipped:", err);
    }
  }

  return next;
}

export async function saveTechniquesDoc(
  doc: TechniquesDocument
): Promise<void> {
  await writeJsonDocument(DOC, { ...doc, version: CURRENT_VERSION });
}

export async function listTechniques(): Promise<Technique[]> {
  const doc = await readTechniquesDoc();
  return [...doc.techniques].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getTechniqueById(
  id: string
): Promise<Technique | undefined> {
  const doc = await readTechniquesDoc();
  return doc.techniques.find((t) => t.id === id);
}

export async function getTechniqueBySlug(
  slug: string
): Promise<Technique | undefined> {
  const doc = await readTechniquesDoc();
  return doc.techniques.find((t) => t.slug === slug);
}

export async function getPublishedTechniques(): Promise<TechniquePublic[]> {
  const list = await listTechniques();
  return list.filter((t) => t.published).map(toPublic);
}

export function toPublic(t: Technique): TechniquePublic {
  return {
    id: t.id,
    slug: t.slug,
    key: t.key,
    sortOrder: t.sortOrder,
    title: t.title,
    tip: t.tip,
    youtubeUrl: t.youtubeUrl,
    youtubeStartSeconds: t.youtubeStartSeconds,
    youtubeEndSeconds: t.youtubeEndSeconds,
    sheetPath: t.sheetPath,
    sheetCols: t.sheetCols,
    sheetRows: t.sheetRows,
    steps: t.steps,
    bonusImages: t.bonusImages,
    professionallyReady: t.professionallyReady ?? t.technicallyApproved,
    technicallyApproved: t.technicallyApproved,
  };
}

export async function upsertTechnique(
  input: Partial<Technique> & { id?: string }
): Promise<Technique> {
  const doc = await readTechniquesDoc();
  const now = new Date().toISOString();
  const existingIdx = input.id
    ? doc.techniques.findIndex((t) => t.id === input.id)
    : -1;

  if (existingIdx >= 0) {
    const prev = doc.techniques[existingIdx];
    const next: Technique = {
      ...prev,
      ...input,
      id: prev.id,
      slug: (input.slug || prev.slug).trim(),
      key: (input.key || prev.key).trim(),
      sheetCols: Math.max(1, input.sheetCols ?? prev.sheetCols),
      sheetRows: Math.max(1, input.sheetRows ?? prev.sheetRows),
      steps: input.steps
        ? input.steps.map((s) => {
            const step: Technique["steps"][number] = {
              caption: s.caption,
              body: s.body,
            };
            if (s.imagePath) step.imagePath = s.imagePath;
            return step;
          })
        : prev.steps,
      bonusImages:
        input.bonusImages !== undefined
          ? input.bonusImages
          : prev.bonusImages,
      referenceText:
        input.referenceText !== undefined
          ? input.referenceText
          : prev.referenceText,
      updatedAt: now,
    };
    doc.techniques[existingIdx] = next;
    await saveTechniquesDoc(doc);
    return next;
  }

  const id = input.id || `tech-${randomUUID().slice(0, 8)}`;
  const created: Technique = {
    id,
    slug: (input.slug || id).trim(),
    key: (input.key || input.slug || id).trim(),
    sortOrder: input.sortOrder ?? (doc.techniques.length + 1) * 10,
    published: input.published ?? false,
    title: input.title || emptyLocalized("New technique"),
    tip: input.tip || emptyLocalized(""),
    referenceText: input.referenceText || "",
    youtubeUrl: input.youtubeUrl || "",
    sheetPath: input.sheetPath,
    sheetCols: Math.max(1, input.sheetCols ?? 2),
    sheetRows: Math.max(1, input.sheetRows ?? 2),
    steps: input.steps?.length ? input.steps : [],
    bonusImages: input.bonusImages || [],
    updatedAt: now,
  };
  doc.techniques.push(created);
  await saveTechniquesDoc(doc);
  return created;
}

export async function deleteTechnique(id: string): Promise<boolean> {
  const doc = await readTechniquesDoc();
  const next = doc.techniques.filter((t) => t.id !== id);
  if (next.length === doc.techniques.length) return false;
  doc.techniques = next;
  await saveTechniquesDoc(doc);
  return true;
}

export async function patchTechnique(
  id: string,
  patch: Partial<Technique>
): Promise<Technique | null> {
  const doc = await readTechniquesDoc();
  const idx = doc.techniques.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const next: Technique = {
    ...doc.techniques[idx],
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };
  doc.techniques[idx] = next;
  await saveTechniquesDoc(doc);
  return next;
}

/**
 * Apply many technique patches in one read/write so Blob updates don't clobber each other.
 */
export async function applyTechniquePatches(
  patches: Array<{ id: string; patch: Partial<Technique> }>
): Promise<Technique[]> {
  const doc = await readTechniquesDoc();
  const now = new Date().toISOString();
  const updated: Technique[] = [];

  for (const { id, patch } of patches) {
    const idx = doc.techniques.findIndex((t) => t.id === id);
    if (idx < 0) continue;
    const next: Technique = {
      ...doc.techniques[idx],
      ...patch,
      id,
      updatedAt: now,
    };
    doc.techniques[idx] = next;
    updated.push(next);
  }

  if (updated.length) {
    await saveTechniquesDoc(doc);
  }
  return updated;
}
