import { NextRequest, NextResponse } from "next/server";
import { getPatternById, upsertPattern } from "@/lib/data/store";
import { validatePatternComponents } from "@/lib/crochet/validator";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const pattern = await getPatternById(id);
  if (!pattern) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const validation = validatePatternComponents(pattern.content.components);
  const saved = await upsertPattern({
    ...pattern,
    validation,
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ pattern: saved });
}
