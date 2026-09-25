import type { Locale } from "@/i18n/routing";

export type LocalizedString = Record<Locale, string>;

export type PatternStatus =
  | "draft"
  | "reviewed"
  | "tested"
  | "published"
  | "archived";

export type ConfidenceLevel = "high" | "medium" | "low";

export type Difficulty = "beginner" | "easy" | "intermediate" | "advanced";

export interface Category {
  id: string;
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
  icon: string;
}

export interface DesignSpec {
  object: string;
  size_cm?: number;
  difficulty: Difficulty;
  colors: string[];
  components: string[];
  style: string;
  construction: string;
  yarn_weight?: string;
  hook_mm?: string;
  estimated_time?: string;
  notes?: string;
  suggested_category_slug?: string;
  suggested_category_name?: string;
  suggested_category_description?: string;
}

export type StitchOpType =
  | "magic_ring"
  | "chain"
  | "sc"
  | "hdc"
  | "dc"
  | "slst"
  | "inc"
  | "dec"
  | "repeat"
  | "skip"
  | "join"
  | "fasten_off"
  | "blo"
  | "flo"
  | "turn"
  | "text";

export interface StitchOperation {
  type: StitchOpType;
  stitches?: number;
  repeat?: number;
  of?: StitchOperation[];
  text?: string;
}

export interface PatternRound {
  round: number;
  instructions: string;
  operations: StitchOperation[];
  result: number;
}

export interface PatternComponent {
  id: string;
  name: string;
  construction: string;
  make?: number;
  rounds: PatternRound[];
  notes?: string;
}

export interface PatternMaterials {
  yarn: string[];
  hook: string;
  notions: string[];
  gauge?: string;
}

export interface Abbreviation {
  abbr: string;
  meaning: string;
}

export interface ValidationIssue {
  componentId: string;
  round: number;
  expected: number | null;
  actual: number | null;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  checkedAt: string;
}

export interface PatternContent {
  title: LocalizedString;
  summary: LocalizedString;
  seoTitle: LocalizedString;
  seoDescription: LocalizedString;
  abbreviations: Abbreviation[];
  materials: PatternMaterials;
  components: PatternComponent[];
  assembly: string[];
  finishing: string[];
}

export interface CrochetPattern {
  id: string;
  slug: string;
  prompt: string;
  designSpec: DesignSpec;
  content: PatternContent;
  imagePath?: string;
  thumbnailPath?: string;
  pdfPath?: string;
  validation: ValidationResult;
  confidence: ConfidenceLevel;
  status: PatternStatus;
  featured: boolean;
  free: boolean;
  priceCents: number;
  currency: string;
  stripePriceId?: string;
  categoryIds: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export type PageKey =
  | "home"
  | "patterns"
  | "categories"
  | "about"
  | "contact"
  | "blog"
  | "privacy"
  | "terms";

export interface PageSeo {
  seoTitle: LocalizedString;
  seoDescription: LocalizedString;
  ogImage?: string;
}

export interface PageCopy {
  heroTitle?: LocalizedString;
  heroSubtitle?: LocalizedString;
  body?: LocalizedString;
  /** Home hero visual card overlay */
  heroCardEyebrow?: LocalizedString;
  heroCardTitle?: LocalizedString;
  heroCardBody?: LocalizedString;
  /** Public path or absolute URL for home hero image */
  heroImage?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  body: LocalizedString;
  seoTitle: LocalizedString;
  seoDescription: LocalizedString;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface SiteContent {
  categories: Category[];
  patterns: CrochetPattern[];
  blogPosts: BlogPost[];
  pages: Partial<Record<PageKey, PageCopy & PageSeo>>;
  settings: {
    siteName: string;
    tagline: LocalizedString;
  };
}

export interface PurchaseRecord {
  id: string;
  patternId: string;
  patternSlug: string;
  sessionId: string;
  email?: string;
  amountCents: number;
  currency: string;
  unlockedAt: string;
}

export function emptyLocalized(value = ""): LocalizedString {
  return { en: value, fr: value, es: value };
}

export function pickLocalized(
  value: LocalizedString | undefined,
  locale: Locale
): string {
  if (!value) return "";
  return value[locale] || value.en || "";
}

export function formatPrice(cents: number, currency = "usd"): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

/** Convert a dollar amount (e.g. 4.99) to Stripe cents. */
export function dollarsToCents(dollars: number): number {
  if (!Number.isFinite(dollars) || dollars <= 0) return 0;
  return Math.round(dollars * 100);
}

/** Convert stored cents to a dollar string for admin inputs. */
export function centsToDollarInput(cents: number): string {
  if (!Number.isFinite(cents)) return "0";
  return (cents / 100).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}
