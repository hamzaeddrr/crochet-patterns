import { NextRequest, NextResponse } from "next/server";
import { getTechniqueById } from "@/lib/data/techniques-store";
import { autoIllustrateTechnique } from "@/lib/ai/auto-technique-illustrations";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      techniqueId?: string;
      maxAttempts?: number;
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

    const result = await autoIllustrateTechnique(technique, {
      maxAttempts: body.maxAttempts,
      cols: body.cols,
      rows: body.rows,
    });

    return NextResponse.json({
      ok: result.approved,
      ...result,
    });
  } catch (error) {
    console.error("auto-illustrate:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Auto illustrate failed",
      },
      { status: 500 }
    );
  }
}
