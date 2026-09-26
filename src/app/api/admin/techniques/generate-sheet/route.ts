import { NextRequest, NextResponse } from "next/server";
import { getTechniqueById, upsertTechnique } from "@/lib/data/techniques-store";
import { generateTechniqueSheet } from "@/lib/ai/generate-technique-sheet";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      techniqueId?: string;
      cols?: number;
      rows?: number;
      customPrompt?: string;
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

    const cols = Math.max(1, Number(body.cols) || technique.sheetCols || 2);
    const rows = Math.max(1, Number(body.rows) || technique.sheetRows || 2);
    const { sheetPath, promptUsed, model } = await generateTechniqueSheet(
      technique,
      { cols, rows, customPrompt: body.customPrompt }
    );

    const updated = await upsertTechnique({
      ...technique,
      id: technique.id,
      sheetPath,
      sheetCols: cols,
      sheetRows: rows,
    });

    return NextResponse.json({
      ok: true,
      sheetPath,
      promptUsed,
      model,
      technique: updated,
    });
  } catch (error) {
    console.error("generate-sheet:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Sheet generation failed",
      },
      { status: 500 }
    );
  }
}
