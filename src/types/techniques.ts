import type { LocalizedString } from "@/types";

/** Studio-detectable keys (and any custom CMS keys). */
export type TechniqueKey =
  | "magic_ring"
  | "sc"
  | "inc"
  | "dec"
  | "fo"
  | "chain"
  | "slst"
  | "hdc"
  | "dc"
  | string;

export interface TechniqueStep {
  caption: LocalizedString;
  body: LocalizedString;
  /** Cropped panel image (public path or Blob URL). */
  imagePath?: string;
}

export interface Technique {
  id: string;
  slug: string;
  /** Matches studio detection / TechniqueTutor keys. */
  key: TechniqueKey;
  sortOrder: number;
  published: boolean;
  title: LocalizedString;
  tip: LocalizedString;
  /** Full YouTube URL or 11-char id — optional. */
  youtubeUrl?: string;
  /** Multi-panel storyboard before cropping. */
  sheetPath?: string;
  sheetCols: number;
  sheetRows: number;
  steps: TechniqueStep[];
  updatedAt: string;
}

export interface TechniquesDocument {
  version: 1;
  techniques: Technique[];
}

/** Safe subset for public pages / studio. */
export type TechniquePublic = Pick<
  Technique,
  | "id"
  | "slug"
  | "key"
  | "sortOrder"
  | "title"
  | "tip"
  | "youtubeUrl"
  | "sheetPath"
  | "sheetCols"
  | "sheetRows"
  | "steps"
>;
