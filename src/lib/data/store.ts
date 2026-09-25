import { promises as fs } from "fs";
import path from "path";
import type { Category, CrochetPattern, SiteContent } from "@/types";
import { emptyLocalized } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "site-content.json");

const defaultCategories: Category[] = [
  {
    id: "amigurumi",
    slug: "amigurumi",
    name: {
      en: "Amigurumi",
      fr: "Amigurumi",
      es: "Amigurumi",
    },
    description: {
      en: "Cute crocheted toys and characters.",
      fr: "Jolis jouets et personnages au crochet.",
      es: "Juguetes y personajes tiernos a crochet.",
    },
    icon: "🧸",
  },
  {
    id: "accessories",
    slug: "accessories",
    name: {
      en: "Accessories",
      fr: "Accessoires",
      es: "Accesorios",
    },
    description: {
      en: "Bags, scarves, hats, and wearable extras.",
      fr: "Sacs, écharpes, chapeaux et accessoires.",
      es: "Bolsos, bufandas, gorros y extras.",
    },
    icon: "🧣",
  },
  {
    id: "home",
    slug: "home",
    name: {
      en: "Home & Decor",
      fr: "Maison & Déco",
      es: "Hogar y Decoración",
    },
    description: {
      en: "Blankets, cushions, and cozy home makes.",
      fr: "Couvertures, coussins et créations cozy.",
      es: "Mantas, cojines y proyectos para el hogar.",
    },
    icon: "🏠",
  },
  {
    id: "seasonal",
    slug: "seasonal",
    name: {
      en: "Seasonal",
      fr: "Saisonnier",
      es: "Temporada",
    },
    description: {
      en: "Holiday and seasonal crochet projects.",
      fr: "Projets de fêtes et de saison.",
      es: "Proyectos festivos y de temporada.",
    },
    icon: "🎄",
  },
];

function defaultContent(): SiteContent {
  return {
    categories: defaultCategories,
    patterns: [],
    settings: {
      siteName: "Loopcraft",
      tagline: {
        en: "Beautiful crochet patterns, carefully crafted.",
        fr: "De beaux modèles au crochet, soigneusement créés.",
        es: "Hermosos patrones de crochet, cuidadosamente elaborados.",
      },
    },
  };
}

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(CONTENT_FILE);
  } catch {
    await fs.writeFile(
      CONTENT_FILE,
      JSON.stringify(defaultContent(), null, 2),
      "utf8"
    );
  }
}

export async function readSiteContent(): Promise<SiteContent> {
  await ensureDataFile();
  const raw = await fs.readFile(CONTENT_FILE, "utf8");
  const parsed = JSON.parse(raw) as SiteContent;
  if (!parsed.categories?.length) {
    parsed.categories = defaultCategories;
  }
  if (!parsed.patterns) parsed.patterns = [];
  if (!parsed.settings) {
    parsed.settings = defaultContent().settings;
  }
  return parsed;
}

export async function saveSiteContent(content: SiteContent): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(CONTENT_FILE, JSON.stringify(content, null, 2), "utf8");
}

export async function getPublishedPatterns(): Promise<CrochetPattern[]> {
  const { patterns } = await readSiteContent();
  return patterns
    .filter((p) => p.status === "published")
    .sort((a, b) => {
      const da = a.publishedAt || a.createdAt;
      const db = b.publishedAt || b.createdAt;
      return db.localeCompare(da);
    });
}

export async function getPatternBySlug(
  slug: string
): Promise<CrochetPattern | undefined> {
  const { patterns } = await readSiteContent();
  return patterns.find((p) => p.slug === slug);
}

export async function getPatternById(
  id: string
): Promise<CrochetPattern | undefined> {
  const { patterns } = await readSiteContent();
  return patterns.find((p) => p.id === id);
}

export async function upsertPattern(
  pattern: CrochetPattern
): Promise<CrochetPattern> {
  const content = await readSiteContent();
  const idx = content.patterns.findIndex((p) => p.id === pattern.id);
  if (idx >= 0) {
    content.patterns[idx] = pattern;
  } else {
    content.patterns.unshift(pattern);
  }
  await saveSiteContent(content);
  return pattern;
}

export async function deletePattern(id: string): Promise<boolean> {
  const content = await readSiteContent();
  const before = content.patterns.length;
  content.patterns = content.patterns.filter((p) => p.id !== id);
  if (content.patterns.length === before) return false;
  await saveSiteContent(content);
  return true;
}

export async function upsertCategory(category: Category): Promise<Category> {
  const content = await readSiteContent();
  const idx = content.categories.findIndex((c) => c.id === category.id);
  if (idx >= 0) content.categories[idx] = category;
  else content.categories.push(category);
  await saveSiteContent(content);
  return category;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const content = await readSiteContent();
  const before = content.categories.length;
  content.categories = content.categories.filter((c) => c.id !== id);
  if (content.categories.length === before) return false;
  await saveSiteContent(content);
  return true;
}

export { emptyLocalized };
