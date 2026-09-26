import { NextRequest, NextResponse } from "next/server";
import { getTechniqueById, patchTechnique } from "@/lib/data/techniques-store";
import { cropSheetToStepImages } from "@/lib/crochet/crop-sheet";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      techniqueId?: string;
      cols?: number;
      rows?: number;
    };
    if (!body.techniqueId) {
      return NextResponse.json(
        { error: "techniqueId required" },
        { status: 400 }
      );
    }
    const technique = await getTechniqueById(body.techniqueId);
    if (!technique) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!technique.sheetPath) {
      return NextResponse.json(
        { error: "Upload or generate a sheet first" },
        { status: 400 }
      );
    }

    const cols = Math.max(1, body.cols ?? technique.sheetCols);
    const rows = Math.max(1, body.rows ?? technique.sheetRows);
    const paths = await cropSheetToStepImages({
      techniqueId: technique.id,
      sheetPath: technique.sheetPath,
      cols,
      rows,
      stepCount: technique.steps.length,
    });

    const steps = technique.steps.map((step, i) => ({
      ...step,
      imagePath: paths[i] || step.imagePath,
    }));

    const updated = await patchTechnique(technique.id, {
      sheetCols: cols,
      sheetRows: rows,
      steps,
    });

    return NextResponse.json({ ok: true, paths, technique: updated });
  } catch (error) {
    console.error("crop-sheet:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Crop failed" },
      { status: 500 }
    );
  }
}
