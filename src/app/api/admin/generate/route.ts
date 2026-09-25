import { NextRequest, NextResponse } from "next/server";
import { generateFullPattern } from "@/lib/ai/generate-full";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pattern = await generateFullPattern({
      prompt: String(body.prompt || ""),
      categoryIds: Array.isArray(body.categoryIds)
        ? body.categoryIds.map(String)
        : undefined,
      featured: body.featured === true,
      free: body.free !== false,
      translate: body.translate !== false,
      generateImage: body.generateImage !== false,
      generatePdf: body.generatePdf !== false,
      save: body.save !== false,
    });
    return NextResponse.json({ ok: true, pattern });
  } catch (error) {
    console.error("Generate error:", error);
    const message =
      error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
