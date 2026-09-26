import { randomUUID } from "crypto";
import {
  generateDesignSpec,
  confidenceFromSpec,
  inventCreativeSubject,
} from "./design-spec";
import { generatePatternContent } from "./generate-pattern";
import { generatePatternImage } from "./generate-image";
import { translatePatternContent } from "./translate";
import {
  repairPatternComponents,
  validatePatternComponents,
} from "@/lib/crochet/validator";
import { normalizePatternComponents } from "@/lib/crochet/construction";
import { buildPatternPdf } from "@/lib/pdf/build-pattern-pdf";
import { readSiteContent, saveSiteContent } from "@/lib/data/store";
import { readAdminSettings } from "@/lib/admin/settings-store";
import { slugify } from "@/lib/utils";
import { withAiUsageRun } from "@/lib/ai/usage-log";
import {
  ensureCategoryFromSpec,
  guessCategoryIds,
} from "@/lib/categories/ensure";
import type { CrochetPattern } from "@/types";

export interface GenerateFullPatternInput {
  prompt?: string;
  creative?: boolean;
  categoryIds?: string[];
  allowNewCategory?: boolean;
  featured?: boolean;
  free?: boolean;
  priceCents?: number;
  currency?: string;
  translate?: boolean;
  generateImage?: boolean;
  generatePdf?: boolean;
  save?: boolean;
}

export async function generateFullPattern(
  input: GenerateFullPatternInput
): Promise<CrochetPattern> {
  const id = randomUUID();
  const { result } = await withAiUsageRun(
    { patternId: id, label: "full-generate" },
    () => generateFullPatternInner(input, id)
  );
  return result;
}

async function generateFullPatternInner(
  input: GenerateFullPatternInput,
  id: string
): Promise<CrochetPattern> {
  let prompt = (input.prompt || "").trim();
  if (!prompt || input.creative) {
    const invented = await inventCreativeSubject();
    prompt = prompt ? `${prompt}. ${invented}` : invented;
  }

  const settings = await readAdminSettings();
  const designSpec = await generateDesignSpec(prompt);
  const { content, suggestedSlug } = await generatePatternContent(
    prompt,
    designSpec
  );

  let finalContent = content;
  if (input.translate !== false) {
    try {
      finalContent = await translatePatternContent(content);
    } catch (err) {
      console.warn("Translation skipped:", err);
    }
  }

  // Auto-fix unreliable AI stitch ops before validation / save
  const repaired = repairPatternComponents(finalContent.components);
  const normalized = normalizePatternComponents(repaired.components);
  finalContent = { ...finalContent, components: normalized };
  const validation = validatePatternComponents(finalContent.components);
  const confidence = confidenceFromSpec(designSpec);

  // Pattern is written first; image is derived from that finished pattern
  let imagePath: string | undefined;
  let thumbnailPath: string | undefined;
  if (input.generateImage !== false) {
    const img = await generatePatternImage(
      id,
      designSpec,
      undefined,
      finalContent
    );
    imagePath = img.imagePath;
    thumbnailPath = img.thumbnailPath;
  }

  const site = await readSiteContent();
  let categoryIds = input.categoryIds?.length ? [...input.categoryIds] : [];

  if (input.allowNewCategory !== false) {
    const created = await ensureCategoryFromSpec(designSpec, site.categories);
    if (created) {
      site.categories = created.categories;
      if (!categoryIds.includes(created.id)) categoryIds.push(created.id);
    }
  }

  if (!categoryIds.length) {
    categoryIds = guessCategoryIds(
      designSpec.construction,
      designSpec.object,
      site.categories.map((c) => c.id)
    );
  }

  let slug = suggestedSlug || slugify(designSpec.object);
  const taken = new Set(site.patterns.map((p) => p.slug));
  if (taken.has(slug)) slug = `${slug}-${id.slice(0, 6)}`;

  const now = new Date().toISOString();
  let pattern: CrochetPattern = {
    id,
    slug,
    prompt,
    designSpec,
    content: finalContent,
    imagePath,
    thumbnailPath,
    validation,
    confidence,
    status: "draft",
    featured: input.featured === true,
    free: input.free === true,
    priceCents:
      typeof input.priceCents === "number"
        ? input.priceCents
        : settings.defaultPriceCents,
    currency: input.currency || settings.defaultCurrency || "usd",
    categoryIds,
    createdAt: now,
    updatedAt: now,
  };

  if (input.generatePdf !== false) {
    try {
      pattern.pdfPath = await buildPatternPdf(pattern);
    } catch (err) {
      console.warn("PDF generation failed:", err);
    }
  }

  // Single write so new categories are not lost by a later upsertPattern re-read
  if (input.save !== false) {
    const idx = site.patterns.findIndex((p) => p.id === pattern.id);
    if (idx >= 0) site.patterns[idx] = pattern;
    else site.patterns.unshift(pattern);
    await saveSiteContent(site);
  }

  return pattern;
}
