import { NextRequest, NextResponse } from "next/server";
import { getPatternById, upsertPattern } from "@/lib/data/store";
import { buildPatternPdf } from "@/lib/pdf/build-pattern-pdf";

export const maxDuration = 60;

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const pattern = await getPatternById(id);
  if (!pattern) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const pdfPath = await buildPatternPdf(pattern);
    const saved = await upsertPattern({
      ...pattern,
      pdfPath,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ pattern: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
