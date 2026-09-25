import { NextRequest, NextResponse } from "next/server";
import {
  deletePattern,
  getPatternById,
  upsertPattern,
} from "@/lib/data/store";
import { translatePatternContent } from "@/lib/ai/translate";
import { generatePatternImage } from "@/lib/ai/generate-image";
import type { PatternStatus } from "@/types";

/** Image regen + translate can exceed default serverless limits. */
export const maxDuration = 300;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const pattern = await getPatternById(id);
  if (!pattern) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ pattern });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const pattern = await getPatternById(id);
  if (!pattern) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json();
  const next = { ...pattern, updatedAt: new Date().toISOString() };

  if (body.action === "retranslate") {
    next.content = await translatePatternContent(next.content, true);
    const saved = await upsertPattern(next);
    return NextResponse.json({ pattern: saved });
  }

  if (body.action === "regenerateImage") {
    try {
      const img = await generatePatternImage(
        next.id,
        next.designSpec,
        undefined,
        next.content
      );
      next.imagePath = img.imagePath;
      next.thumbnailPath = img.thumbnailPath;
      const saved = await upsertPattern(next);
      return NextResponse.json({
        pattern: saved,
        image: {
          model: img.model,
          quality: img.quality,
          size: img.size,
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Image generation failed";
      console.error("regenerateImage failed:", err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (typeof body.status === "string") {
    next.status = body.status as PatternStatus;
    if (body.status === "published" && !next.publishedAt) {
      next.publishedAt = new Date().toISOString();
    }
  }
  if (typeof body.featured === "boolean") next.featured = body.featured;
  if (typeof body.free === "boolean") next.free = body.free;
  if (typeof body.priceCents === "number") next.priceCents = body.priceCents;
  if (typeof body.priceDollars === "number") {
    next.priceCents = Math.round(body.priceDollars * 100);
  }
  if (typeof body.currency === "string") next.currency = body.currency.toLowerCase();
  else if (!next.currency) next.currency = "usd";
  if (Array.isArray(body.categoryIds)) {
    next.categoryIds = body.categoryIds.map(String);
  }
  if (body.content && typeof body.content === "object") {
    next.content = { ...next.content, ...body.content };
  }
  if (typeof body.slug === "string" && body.slug.trim()) {
    next.slug = body.slug.trim();
  }

  const saved = await upsertPattern(next);
  return NextResponse.json({ pattern: saved });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const ok = await deletePattern(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
