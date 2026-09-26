import { NextRequest, NextResponse } from "next/server";
import { getTechniqueById, upsertTechnique } from "@/lib/data/techniques-store";
import { cropSheetRegion } from "@/lib/crochet/crop-sheet";
import type { TechniqueStep } from "@/types/techniques";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Manual crop from a sheet region.
 * target: "auto" | "bonus" | step index number
 * auto → first step without an image, else bonus.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      techniqueId?: string;
      sheetPath?: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      target?: "auto" | "bonus" | number;
    };

    if (!body.techniqueId) {
      return NextResponse.json(
        { error: "techniqueId required" },
        { status: 400 }
      );
    }

    const x = Number(body.x);
    const y = Number(body.y);
    const width = Number(body.width);
    const height = Number(body.height);
    if (
      ![x, y, width, height].every((n) => Number.isFinite(n)) ||
      width <= 0.005 ||
      height <= 0.005
    ) {
      return NextResponse.json(
        { error: "Valid crop region required (x, y, width, height as 0–1)" },
        { status: 400 }
      );
    }

    const technique = await getTechniqueById(body.techniqueId);
    if (!technique) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const sheetPath = (body.sheetPath || technique.sheetPath || "").trim();
    if (!sheetPath) {
      return NextResponse.json(
        { error: "Upload or generate a sheet first" },
        { status: 400 }
      );
    }

    const imagePath = await cropSheetRegion({
      techniqueId: technique.id,
      sheetPath,
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      width: Math.max(0, Math.min(1 - x, width)),
      height: Math.max(0, Math.min(1 - y, height)),
      label: "manual",
    });

    let steps: TechniqueStep[] = technique.steps.map((s) => ({ ...s }));
    let bonusImages = [...(technique.bonusImages || [])];
    let assigned: "bonus" | number = "bonus";

    const target = body.target ?? "auto";

    if (target === "bonus") {
      bonusImages.push(imagePath);
      assigned = "bonus";
    } else if (typeof target === "number" && Number.isFinite(target)) {
      const idx = Math.max(0, Math.floor(target));
      if (idx >= steps.length) {
        bonusImages.push(imagePath);
        assigned = "bonus";
      } else {
        steps[idx] = { ...steps[idx], imagePath };
        assigned = idx;
      }
    } else {
      // auto
      const emptyIdx = steps.findIndex((s) => !s.imagePath);
      if (emptyIdx >= 0) {
        steps[emptyIdx] = { ...steps[emptyIdx], imagePath };
        assigned = emptyIdx;
      } else {
        bonusImages.push(imagePath);
        assigned = "bonus";
      }
    }

    const updated = await upsertTechnique({
      ...technique,
      id: technique.id,
      sheetPath,
      steps,
      bonusImages,
    });

    return NextResponse.json({
      ok: true,
      imagePath,
      assigned,
      technique: updated,
    });
  } catch (error) {
    console.error("crop-region:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Manual crop failed" },
      { status: 500 }
    );
  }
}
