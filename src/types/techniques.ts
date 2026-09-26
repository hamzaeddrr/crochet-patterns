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
  /**
   * Live on /learn + studio when true; draft when false.
   * New / migrated techniques start as draft.
   */
  published: boolean;
  /** True when auto-illustrate finished and images are ready for studio. */
  professionallyReady?: boolean;
  /** @deprecated kept for older stored docs */
  technicallyApproved?: boolean;
  title: LocalizedString;
  tip: LocalizedString;
  /**
   * Pasted / written reference notes (any language).
   * Used by AI to generate step captions + bodies.
   */
  referenceText?: string;
  /** Full YouTube URL or 11-char id — optional landscape tutorial. */
  youtubeUrl?: string;
  /** Skip intro bumper (seconds from start). */
  youtubeStartSeconds?: number;
  /** Stop before end cards (seconds from start). */
  youtubeEndSeconds?: number;
  /** Optional second video — shown in Shorts / vertical (9:16) frame. */
  youtubeShortUrl?: string;
  youtubeShortStartSeconds?: number;
  youtubeShortEndSeconds?: number;
  /** Multi-panel storyboard before cropping. */
  sheetPath?: string;
  /** Show the full storyboard sheet on the public /learn page. */
  showSheetOnPage?: boolean;
  sheetCols: number;
  sheetRows: number;
  steps: TechniqueStep[];
  /**
   * Extra crops that did not fit into steps (manual or grid overflow).
   * Can be promoted into a step later.
   */
  bonusImages?: string[];
  /**
   * Optional custom chart-key image (overrides the built-in SVG glyph).
   * Keep small — one symbol, not a full pattern chart.
   */
  chartSymbolPath?: string;
  /** One-line “In charts, this means…” for the learn chart key. */
  chartSymbolNote?: LocalizedString;
  updatedAt: string;
}

export interface TechniquesDocument {
  /** 2 = blank-step draft reset for manual rebuild. */
  version: 1 | 2;
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
  | "youtubeStartSeconds"
  | "youtubeEndSeconds"
  | "youtubeShortUrl"
  | "youtubeShortStartSeconds"
  | "youtubeShortEndSeconds"
  | "sheetPath"
  | "showSheetOnPage"
  | "sheetCols"
  | "sheetRows"
  | "steps"
  | "bonusImages"
  | "chartSymbolPath"
  | "chartSymbolNote"
  | "professionallyReady"
  | "technicallyApproved"
>;
