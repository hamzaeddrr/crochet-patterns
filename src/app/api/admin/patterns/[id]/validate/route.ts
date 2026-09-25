import { NextRequest, NextResponse } from "next/server";
import { getPatternById, upsertPattern } from "@/lib/data/store";
import {
  repairPatternComponents,
  validatePatternComponents,
} from "@/lib/crochet/validator";
import { confidenceFromSpec } from "@/lib/ai/design-spec";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const pattern = await getPatternById(id);
  if (!pattern) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let repair = false;
  try {
    const body = await request.json();
    repair = body?.repair === true;
  } catch {
    repair = false;
  }

  let components = pattern.content.components;
  let fixed = 0;
  if (repair) {
    const out = repairPatternComponents(components);
    components = out.components;
    fixed = out.fixed;
  }

  const validation = validatePatternComponents(components);
  const confidence = validation.ok
    ? pattern.confidence === "low"
      ? "medium"
      : pattern.confidence
    : confidenceFromSpec(pattern.designSpec);

  const saved = await upsertPattern({
    ...pattern,
    content: { ...pattern.content, components },
    validation,
    confidence,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ pattern: saved, repaired: repair, fixed });
}
