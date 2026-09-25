import { randomUUID } from "crypto";
import {
  generateDesignSpec,
  confidenceFromSpec,
  inventCreativeSubject,
} from "./design-spec";
import { generatePatternContent } from "./generate-pattern";
import { generatePatternImage } from "./generate-image";
import { translatePatternContent } from "./translate";
import { validatePatternComponents } from "@/lib/crochet/validator";
import { buildPatternPdf } from "@/lib/pdf/build-pattern-pdf";
import {
  readSiteContent,
  saveSiteContent,
  upsertPattern,
} from "@/lib/data/store";
import { readAdminSettings } from "@/lib/admin/settings-store";
import { slugify } from "@/lib/utils";
import {
  emptyLocalized,
  type Category,
  type CrochetPattern,
  type DesignSpec,
} from "@/types";

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
  let prompt = (input.prompt || "").trim();
  if (!prompt || input.creative) {
    const invented = await inventCreativeSubject();
    prompt = prompt ? `${prompt}. ${invented}` : invented;
  }

  const id = randomUUID();
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

  const validation = validatePatternComponents(finalContent.components);
  const confidence = confidenceFromSpec(designSpec);

  let imagePath: string | undefined;
  let thumbnailPath: string | undefined;
  if (input.generateImage !== false) {
    const img = await generatePatternImage(id, designSpec);
    imagePath = img.imagePath;
    thumbnailPath = img.thumbnailPath;
  }

  const site = await readSiteContent();
  let categoryIds = input.categoryIds?.length ? [...input.categoryIds] : [];

  if (input.allowNewCategory !== false) {
    const created = await ensureCategoryFromSpec(designSpec, site.categories);
    if (created) {
      site.categories = created.categories;
      await saveSiteContent(site);
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
    currency: input.currency || settings.defaultCurrency || "eur",
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

  if (input.save !== false) {
    pattern = await upsertPattern(pattern);
  }

  return pattern;
}

async function ensureCategoryFromSpec(
  spec: DesignSpec,
  existing: Category[]
): Promise<{ id: string; categories: Category[] } | null> {
  const slug = slugify(
    spec.suggested_category_slug ||
      spec.suggested_category_name ||
      spec.construction ||
      ""
  );
  if (!slug) return null;
  const found = existing.find((c) => c.slug === slug || c.id === slug);
  if (found) return { id: found.id, categories: existing };

  const nameEn =
    spec.suggested_category_name ||
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const descEn =
    spec.suggested_category_description ||
    `Crochet patterns in the ${nameEn} category.`;

  const category: Category = {
    id: slug,
    slug,
    name: emptyLocalized(nameEn),
    description: emptyLocalized(descEn),
    icon: "🧶",
  };

  // Best-effort translate category labels
  try {
    const { translateLocalizedField } = await import("./translate");
    category.name = await translateLocalizedField(nameEn);
    category.description = await translateLocalizedField(descEn);
  } catch {
    /* keep EN */
  }

  return { id: category.id, categories: [...existing, category] };
}

function guessCategoryIds(
  construction: string,
  object: string,
  available: string[]
): string[] {
  const text = `${construction} ${object}`.toLowerCase();
  if (text.includes("amigurumi") || /frog|bunny|bear|duck|dragon/.test(text)) {
    if (available.includes("amigurumi")) return ["amigurumi"];
  }
  if (/bag|scarf|hat|beanie|mittens/.test(text)) {
    if (available.includes("accessories")) return ["accessories"];
  }
  if (/blanket|cushion|pillow|basket/.test(text)) {
    if (available.includes("home")) return ["home"];
  }
  if (/christmas|halloween|easter|valentine/.test(text)) {
    if (available.includes("seasonal")) return ["seasonal"];
  }
  return available.includes("amigurumi")
    ? ["amigurumi"]
    : available.slice(0, 1);
}
