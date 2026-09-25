import { randomUUID } from "crypto";
import { generateDesignSpec, confidenceFromSpec } from "./design-spec";
import { generatePatternContent } from "./generate-pattern";
import { generatePatternImage } from "./generate-image";
import { translatePatternContent } from "./translate";
import { validatePatternComponents } from "@/lib/crochet/validator";
import { buildPatternPdf } from "@/lib/pdf/build-pattern-pdf";
import { upsertPattern, readSiteContent } from "@/lib/data/store";
import { slugify } from "@/lib/utils";
import type { CrochetPattern } from "@/types";

export interface GenerateFullPatternInput {
  prompt: string;
  categoryIds?: string[];
  featured?: boolean;
  free?: boolean;
  translate?: boolean;
  generateImage?: boolean;
  generatePdf?: boolean;
  save?: boolean;
}

export async function generateFullPattern(
  input: GenerateFullPatternInput
): Promise<CrochetPattern> {
  const prompt = input.prompt.trim();
  if (!prompt) throw new Error("Prompt is required");

  const id = randomUUID();
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
    free: input.free !== false,
    categoryIds: input.categoryIds?.length
      ? input.categoryIds
      : guessCategoryIds(designSpec.construction, designSpec.object, site.categories.map((c) => c.id)),
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
  return available.includes("amigurumi") ? ["amigurumi"] : available.slice(0, 1);
}
