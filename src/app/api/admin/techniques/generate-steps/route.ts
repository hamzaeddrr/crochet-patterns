import { NextRequest, NextResponse } from "next/server";
import { applyGeneratedStepsToTechnique } from "@/lib/ai/generate-technique-steps";
import { getTechniqueById, upsertTechnique } from "@/lib/data/techniques-store";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      techniqueId?: string;
      referenceText?: string;
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

    const referenceText = (
      body.referenceText ??
      technique.referenceText ??
      ""
    ).trim();
    if (!referenceText) {
      return NextResponse.json(
        { error: "Paste or write reference text first" },
        { status: 400 }
      );
    }

    const drafted = await applyGeneratedStepsToTechnique(
      technique,
      referenceText
    );
    const updated = await upsertTechnique({
      ...drafted,
      id: technique.id,
      steps: drafted.steps,
      referenceText: drafted.referenceText,
      professionallyReady: false,
      technicallyApproved: false,
    });

    return NextResponse.json({
      ok: true,
      technique: updated,
      stepCount: updated.steps.length,
      message: `Generated ${updated.steps.length} steps from your reference (still draft until you go live).`,
    });
  } catch (error) {
    console.error("generate-steps:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not generate steps",
      },
      { status: 500 }
    );
  }
}
