import { NextRequest, NextResponse } from "next/server";
import { batchIllustrateTechniques } from "@/lib/ai/batch-technique-illustrations";
import { listTechniques } from "@/lib/data/techniques-store";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      maxSheets?: number;
      cols?: number;
      rows?: number;
      onlyMissing?: boolean;
      techniqueIds?: string[];
    };

    const result = await batchIllustrateTechniques({
      maxSheets: body.maxSheets,
      cols: body.cols,
      rows: body.rows,
      onlyMissing: body.onlyMissing,
      techniqueIds: body.techniqueIds,
    });

    const techniques = await listTechniques();

    return NextResponse.json({
      ok: true,
      ...result,
      techniques,
    });
  } catch (error) {
    console.error("batch-illustrate:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Batch illustration failed",
      },
      { status: 500 }
    );
  }
}
