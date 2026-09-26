import { rgb, type RGB } from "pdf-lib";

/** Loopcraft brand tokens for PDF (0–1 rgb). */
export const PDF_THEME = {
  ink: hex("#2b2522"),
  muted: hex("#6e655e"),
  softMuted: hex("#9a938a"),
  apricot: hex("#d96b52"),
  apricotDeep: hex("#c4573f"),
  celadon: hex("#8fa58b"),
  celadonBright: hex("#a3b8a0"),
  gold: hex("#c49a5a"),
  bone: hex("#faf7f2"),
  boneDeep: hex("#f3ebe0"),
  elevated: hex("#efe7db"),
  line: hex("#e4d9cb"),
  white: hex("#ffffff"),
  coverOverlay: rgb(0.12, 0.1, 0.09),
} as const;

export const PDF_PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 48,
  headerH: 36,
  footerH: 40,
  contentTop: 841.89 - 48 - 28,
} as const;

export function contentWidth(): number {
  return PDF_PAGE.width - PDF_PAGE.margin * 2;
}

export function hex(hexColor: string): RGB {
  const h = hexColor.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = Number.parseInt(full, 16);
  return rgb(
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255
  );
}

/** Resolve a yarn/design color name to a fill for swatches. */
export function colorFromName(name: string): RGB {
  const n = name.toLowerCase().replace(/[_-]+/g, " ");
  const map: Record<string, string> = {
    cream: "#f3ebe0",
    ivory: "#f5f0e6",
    white: "#faf7f2",
    blush: "#e8b4a8",
    pink: "#d9899a",
    coral: "#d96b52",
    apricot: "#d96b52",
    mustard: "#c49a5a",
    yellow: "#d4b56a",
    gold: "#c49a5a",
    teal: "#5f8f8a",
    green: "#8fa58b",
    sage: "#8fa58b",
    mint: "#a3b8a0",
    navy: "#3a4a5c",
    blue: "#6b8499",
    red: "#c4573f",
    burgundy: "#7a2e2e",
    brown: "#6b4a35",
    beige: "#d9cbb8",
    heather: "#9a938a",
    grey: "#9a938a",
    gray: "#9a938a",
    black: "#2b2522",
    purple: "#7a6b8a",
    lavender: "#b7a7c9",
    orange: "#e0894a",
  };
  for (const [key, val] of Object.entries(map)) {
    if (n.includes(key)) return hex(val);
  }
  return hex("#c4b8a8");
}
