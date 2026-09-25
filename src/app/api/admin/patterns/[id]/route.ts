import { NextRequest, NextResponse } from "next/server";
import {
  deletePattern,
  getPatternById,
  upsertPattern,
} from "@/lib/data/store";
import type { PatternStatus } from "@/types";

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

  if (typeof body.status === "string") {
    next.status = body.status as PatternStatus;
    if (body.status === "published" && !next.publishedAt) {
      next.publishedAt = new Date().toISOString();
    }
  }
  if (typeof body.featured === "boolean") next.featured = body.featured;
  if (typeof body.free === "boolean") next.free = body.free;
  if (Array.isArray(body.categoryIds)) {
    next.categoryIds = body.categoryIds.map(String);
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
