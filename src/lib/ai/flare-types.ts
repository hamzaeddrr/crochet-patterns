/** Client-safe Flare helpers */

export type FlareGenerateQuality =
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max"
  | "auto";

export const FLARE_GENERATE_QUALITIES: FlareGenerateQuality[] = [
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
  "auto",
];

export function isFlareGenerateQuality(
  value: unknown
): value is FlareGenerateQuality {
  return (
    typeof value === "string" &&
    (FLARE_GENERATE_QUALITIES as string[]).includes(value)
  );
}

export function isFlareModel(model: string): boolean {
  return model.includes("flare") || model.includes("sunburst");
}
