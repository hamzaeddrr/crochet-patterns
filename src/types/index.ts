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
  categoryIds: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface SiteContent {
  categories: Category[];
  patterns: CrochetPattern[];
  settings: {
    siteName: string;
    tagline: LocalizedString;
  };
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
