import type { PatternComponent } from "@/types";
import {
  cleanComponentDisplayName,
  isCrochetedComponent,
} from "@/lib/crochet/construction";

export type PartShape =
  | "sphere"
  | "egg"
  | "disc"
  | "wing"
  | "cone"
  | "capsule"
  | "torus";

export type AssemblyPart3D = {
  id: string;
  label: string;
  make: number;
  shape: PartShape;
  color: string;
  /** Resting position in assembled pose */
  position: [number, number, number];
  /** Scale XYZ */
  scale: [number, number, number];
  /** Euler rotation in radians */
  rotation: [number, number, number];
  /** Offset used when the part is still “incoming” before place */
  enterFrom: [number, number, number];
};

const PALETTE = [
  "#d96b52",
  "#8fa58b",
  "#c49a5a",
  "#e8a0b0",
  "#4a9b8c",
  "#e6c35c",
  "#7a6b8a",
  "#6b4a35",
];

function colorFromName(name: string, fallback: string): string {
  const n = name.toLowerCase();
  const map: Record<string, string> = {
    navy: "#1e3a5f",
    blue: "#3b6ea5",
    teal: "#4a9b8c",
    cream: "#f5ead7",
    white: "#f7f4ef",
    ivory: "#f3ebe0",
    yellow: "#e6c35c",
    gold: "#c49a5a",
    mustard: "#c49a5a",
    pink: "#e8a0b0",
    coral: "#d96b52",
    apricot: "#d96b52",
    green: "#8fa58b",
    sage: "#8fa58b",
    mint: "#a3b8a0",
    red: "#c4573f",
    brown: "#6b4a35",
    beige: "#d9cbb8",
    grey: "#9a938a",
    gray: "#9a938a",
    black: "#2b2522",
    purple: "#7a6b8a",
    orange: "#e0894a",
  };
  for (const [key, val] of Object.entries(map)) {
    if (n.includes(key)) return val;
  }
  return fallback;
}

function inferShape(label: string): PartShape {
  const n = label.toLowerCase();
  if (/\b(wing|arm|flipper)\b/.test(n)) return "wing";
  if (/\b(belly|appliqu|patch|plaque|spot)\b/.test(n)) return "disc";
  if (/\b(ear\s*tuft|tuft|spike|horn|beak|nose|snout)\b/.test(n)) return "cone";
  if (/\b(ear|head|ball|pom\s*pom)\b/.test(n)) return "sphere";
  if (/\b(body|torso|trunk)\b/.test(n)) return "egg";
  if (/\b(leg|foot|tail|limb)\b/.test(n)) return "capsule";
  if (/\b(scarf|collar|ring|wreath)\b/.test(n)) return "torus";
  if (/\b(hat|cap)\b/.test(n)) return "cone";
  return "egg";
}

/**
 * Build a professional assembly layout from crocheted components.
 * Positions are heuristic (amigurumi-style) — good for guidance, not CAD accuracy.
 */
export function buildAssemblyParts3D(
  components: PatternComponent[],
  suggestedColors: string[] = []
): AssemblyPart3D[] {
  const crocheted = components.filter(isCrochetedComponent).slice(0, 10);
  if (!crocheted.length) return [];

  const palette = suggestedColors.length
    ? suggestedColors.map((c, i) => colorFromName(c, PALETTE[i % PALETTE.length]))
    : PALETTE;

  const parts: AssemblyPart3D[] = crocheted.map((c, i) => {
    const { title } = cleanComponentDisplayName(c.name, c.make);
    const shape = inferShape(title);
    const color = palette[i % palette.length];
    const make = c.make && c.make > 1 ? c.make : 1;

    return {
      id: c.id,
      label: title,
      make,
      shape,
      color,
      position: [0, 0, 0],
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
      enterFrom: [0, 1.4, 0],
    };
  });

  // Layout by role when possible; otherwise orbit around body
  const byRole = (re: RegExp) =>
    parts.find((p) => re.test(p.label.toLowerCase()));

  const body = byRole(/\bbody|torso\b/) || parts[0];
  const head = byRole(/\bhead\b/);
  const belly = byRole(/\bbelly|appliqu\b/);
  const beak = byRole(/\bbeak|nose|snout\b/);
  const wings = parts.filter((p) => /\bwing|arm\b/.test(p.label.toLowerCase()));
  const ears = parts.filter((p) =>
    /\bear|tuft\b/.test(p.label.toLowerCase())
  );
  const legs = parts.filter((p) =>
    /\bleg|foot\b/.test(p.label.toLowerCase())
  );
  const placed = new Set<string>();

  function place(
    p: AssemblyPart3D | undefined,
    pos: [number, number, number],
    scale: [number, number, number],
    rot: [number, number, number] = [0, 0, 0],
    enter?: [number, number, number]
  ) {
    if (!p || placed.has(p.id)) return;
    p.position = pos;
    p.scale = scale;
    p.rotation = rot;
    p.enterFrom = enter || [pos[0] * 1.6, pos[1] + 1.2, pos[2] * 1.6];
    placed.add(p.id);
  }

  place(body, [0, 0, 0], [1.05, 1.25, 0.95], [0, 0, 0], [0, -1.5, 0]);
  place(head, [0, 1.15, 0.05], [0.85, 0.85, 0.85], [0, 0, 0], [0, 2.2, 0]);
  place(belly, [0, 0.05, 0.55], [0.7, 0.75, 0.18], [0.15, 0, 0], [0, 0, 1.8]);
  place(beak, [0, 1.05, 0.55], [0.28, 0.22, 0.4], [0.4, 0, 0], [0, 1.1, 1.6]);

  wings.forEach((w, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    place(
      w,
      [side * 0.85, 0.25, 0],
      [0.35, 0.75, 0.55],
      [0.2, 0, side * 0.45],
      [side * 2, 0.4, 0]
    );
  });

  ears.forEach((e, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    place(
      e,
      [side * 0.4, 1.65, -0.05],
      [0.28, 0.4, 0.28],
      [0, 0, side * 0.25],
      [side * 0.8, 2.4, 0]
    );
  });

  legs.forEach((l, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    place(
      l,
      [side * 0.35, -0.95, 0.1],
      [0.28, 0.45, 0.28],
      [0, 0, 0],
      [side * 0.5, -2, 0]
    );
  });

  // Remaining parts: gentle orbit so nothing stacks on origin
  const leftovers = parts.filter((p) => !placed.has(p.id));
  leftovers.forEach((p, i) => {
    const n = leftovers.length;
    const angle = -Math.PI / 2 + (i / Math.max(n, 1)) * Math.PI * 2;
    const r = 1.15;
    place(
      p,
      [Math.cos(angle) * r, 0.2 + (i % 3) * 0.15, Math.sin(angle) * r],
      p.shape === "disc" ? [0.55, 0.55, 0.16] : [0.55, 0.55, 0.55],
      [0, -angle, 0],
      [Math.cos(angle) * 2.2, 1.5, Math.sin(angle) * 2.2]
    );
  });

  return parts;
}
