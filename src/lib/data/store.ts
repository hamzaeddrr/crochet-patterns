import { promises as fs } from "fs";
import path from "path";
import type {
  BlogPost,
  Category,
  CrochetPattern,
  PageKey,
  SiteContent,
} from "@/types";
import { emptyLocalized } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "site-content.json");

const defaultCategories: Category[] = [
  {
    id: "amigurumi",
    slug: "amigurumi",
    name: emptyLocalized("Amigurumi"),
    description: {
      en: "Cute crocheted toys and characters.",
      fr: "Jolis jouets et personnages au crochet.",
      es: "Juguetes y personajes tiernos a crochet.",
    },
    icon: "🧶",
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
    icon: "✨",
  },
];

function defaultPages(): SiteContent["pages"] {
  return {
    home: {
      heroTitle: {
        en: "From first loop to finished make.",
        fr: "Du premier rang à la pièce terminée.",
        es: "Del primer punto a la pieza terminada.",
      },
      heroSubtitle: {
        en: "Studio-crafted crochet patterns with project photos and print-ready PDFs.",
        fr: "Modèles de studio avec photos et PDF prêts à imprimer.",
        es: "Patrones de estudio con fotos y PDF listos para imprimir.",
      },
      heroCardEyebrow: emptyLocalized("Soft makes · Clear rounds"),
      heroCardTitle: emptyLocalized("Stitch by stitch"),
      heroCardBody: emptyLocalized(
        "Cozy patterns with photos and print-ready PDFs."
      ),
      heroImage: "",
      seoTitle: emptyLocalized("Loopcraft — Crochet Patterns"),
      seoDescription: {
        en: "Beautiful crochet patterns with clear instructions and printable PDFs.",
        fr: "Beaux modèles au crochet avec instructions claires et PDF.",
        es: "Hermosos patrones de crochet con instrucciones claras y PDF.",
      },
    },
    about: {
      body: {
        en: "Loopcraft is a crochet pattern studio. We design and publish clear, beautiful patterns with project photos and printable PDFs — in English, French, and Spanish.",
        fr: "Loopcraft est un studio de modèles au crochet.",
        es: "Loopcraft es un estudio de patrones de crochet.",
      },
      seoTitle: emptyLocalized("About Loopcraft"),
      seoDescription: emptyLocalized("About the Loopcraft crochet studio."),
    },
    contact: {
      body: emptyLocalized("Questions about a pattern? Send us a note."),
      seoTitle: emptyLocalized("Contact"),
      seoDescription: emptyLocalized("Contact Loopcraft."),
    },
    patterns: {
      seoTitle: emptyLocalized("Crochet patterns"),
      seoDescription: emptyLocalized("Browse free and paid crochet patterns."),
    },
    categories: {
      seoTitle: emptyLocalized("Categories"),
      seoDescription: emptyLocalized("Explore crochet patterns by type."),
    },
    blog: {
      seoTitle: emptyLocalized("Blog"),
      seoDescription: emptyLocalized("Tips and studio notes."),
    },
    privacy: {
      seoTitle: emptyLocalized("Privacy Policy"),
      seoDescription: emptyLocalized("How Loopcraft handles your data."),
      body: emptyLocalized(
        "Loopcraft stores only the information needed to run the site. We do not sell personal data."
      ),
    },
    terms: {
      seoTitle: emptyLocalized("Terms of Use"),
      seoDescription: emptyLocalized("Terms for using Loopcraft patterns."),
      body: emptyLocalized(
        "Patterns are for personal use unless a listing states commercial rights. Paid unlocks are for the purchaser only."
      ),
    },
  };
}

function defaultContent(): SiteContent {
  return {
    categories: defaultCategories,
    patterns: [],
    blogPosts: [],
    pages: defaultPages(),
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

function normalizePattern(p: CrochetPattern): CrochetPattern {
  return {
    ...p,
    free: p.free === true,
    priceCents: typeof p.priceCents === "number" ? p.priceCents : 499,
    currency: p.currency || "usd",
    featured: Boolean(p.featured),
    categoryIds: p.categoryIds || [],
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
  const parsed = JSON.parse(raw) as Partial<SiteContent>;
  const base = defaultContent();
  return {
    categories: parsed.categories?.length
      ? parsed.categories
      : base.categories,
    patterns: (parsed.patterns || []).map(normalizePattern),
    blogPosts: parsed.blogPosts || [],
    pages: { ...base.pages, ...(parsed.pages || {}) },
    settings: parsed.settings || base.settings,
  };
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
  const normalized = normalizePattern(pattern);
  const idx = content.patterns.findIndex((p) => p.id === normalized.id);
  if (idx >= 0) content.patterns[idx] = normalized;
  else content.patterns.unshift(normalized);
  await saveSiteContent(content);
  return normalized;
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
  content.patterns = content.patterns.map((p) => ({
    ...p,
    categoryIds: p.categoryIds.filter((cid) => cid !== id),
  }));
  if (content.categories.length === before) return false;
  await saveSiteContent(content);
  return true;
}

export async function updateSiteSettings(
  settings: SiteContent["settings"]
): Promise<void> {
  const content = await readSiteContent();
  content.settings = settings;
  await saveSiteContent(content);
}

export async function updatePage(
  key: PageKey,
  page: NonNullable<SiteContent["pages"][PageKey]>
): Promise<void> {
  const content = await readSiteContent();
  content.pages[key] = { ...(content.pages[key] || {}), ...page };
  await saveSiteContent(content);
}

export async function upsertBlogPost(post: BlogPost): Promise<BlogPost> {
  const content = await readSiteContent();
  const idx = content.blogPosts.findIndex((p) => p.id === post.id);
  if (idx >= 0) content.blogPosts[idx] = post;
  else content.blogPosts.unshift(post);
  await saveSiteContent(content);
  return post;
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  const content = await readSiteContent();
  const before = content.blogPosts.length;
  content.blogPosts = content.blogPosts.filter((p) => p.id !== id);
  if (content.blogPosts.length === before) return false;
  await saveSiteContent(content);
  return true;
}

export { emptyLocalized };
