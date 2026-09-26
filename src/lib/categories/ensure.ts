import { emptyLocalized, type Category, type DesignSpec } from "@/types";
import { slugify } from "@/lib/utils";

/**
 * Resolve or create a category from a design spec suggestion.
 * Returns null only when no slug can be derived.
 */
export async function ensureCategoryFromSpec(
  spec: DesignSpec,
  existing: Category[],
  preferredId?: string
): Promise<{ id: string; categories: Category[]; created: boolean } | null> {
  const slug = slugify(
    preferredId ||
      spec.suggested_category_slug ||
      spec.suggested_category_name ||
      spec.construction ||
      ""
  );
  if (!slug) return null;

  const found = existing.find((c) => c.slug === slug || c.id === slug);
  if (found) return { id: found.id, categories: existing, created: false };

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

  try {
    const { translateLocalizedField } = await import("@/lib/ai/translate");
    category.name = await translateLocalizedField(nameEn);
    category.description = await translateLocalizedField(descEn);
  } catch {
    /* keep EN */
  }

  return {
    id: category.id,
    categories: [...existing, category],
    created: true,
  };
}

export function guessCategoryIds(
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
