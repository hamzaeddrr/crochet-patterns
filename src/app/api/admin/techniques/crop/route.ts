import { NextRequest, NextResponse } from "next/server";
import { getTechniqueById, upsertTechnique } from "@/lib/data/techniques-store";
import { cropAllSheetCells } from "@/lib/crochet/crop-sheet";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      techniqueId?: string;
      cols?: number;
      rows?: number;
      /** Prefer form sheet path — Blob doc reads can lag after generate/upload. */
      sheetPath?: string;
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

    const sheetPath = (body.sheetPath || technique.sheetPath || "").trim();
    if (!sheetPath) {
      return NextResponse.json(
        { error: "Upload or generate a sheet first" },
        { status: 400 }
      );
    }

    const cols = Math.max(1, Number(body.cols) || technique.sheetCols || 2);
    const rows = Math.max(1, Number(body.rows) || technique.sheetRows || 2);

    const paths = await cropAllSheetCells({
      techniqueId: technique.id,
      sheetPath,
      cols,
      rows,
    });

    if (!paths.length) {
      return NextResponse.json(
        { error: "Crop produced no images — check cols/rows vs sheet" },
        { status: 500 }
      );
    }

    const stepCount = technique.steps?.length || 0;
    const steps = (technique.steps || []).map((step, i) => ({
      ...step,
      imagePath: paths[i] || step.imagePath,
    }));
    const overflow = paths.slice(stepCount);
    const bonusImages = [
      ...(technique.bonusImages || []),
      ...overflow,
    ];

    const updated = await upsertTechnique({
      ...technique,
      id: technique.id,
      sheetPath,
      sheetCols: cols,
      sheetRows: rows,
      steps,
      bonusImages,
    });

    return NextResponse.json({
      ok: true,
      paths,
      stepAssigned: Math.min(paths.length, stepCount),
      bonusAssigned: overflow.length,
      technique: updated,
    });
  } catch (error) {
    console.error("crop-sheet:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Crop failed" },
      { status: 500 }
    );
  }
}
