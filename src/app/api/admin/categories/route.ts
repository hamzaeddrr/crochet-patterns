import { NextRequest, NextResponse } from "next/server";
import {
  deleteCategory,
  readSiteContent,
  upsertCategory,
} from "@/lib/data/store";
import { emptyLocalized, type Category } from "@/types";
import { slugify } from "@/lib/utils";
import { randomUUID } from "crypto";

export async function GET() {
  const { categories } = await readSiteContent();
  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const nameEn = String(body.nameEn || body.name?.en || "").trim();
  if (!nameEn) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  const slug = slugify(String(body.slug || nameEn));
  const category: Category = {
    id: body.id || randomUUID(),
    slug,
    name: {
      en: nameEn,
      fr: String(body.nameFr || body.name?.fr || nameEn),
      es: String(body.nameEs || body.name?.es || nameEn),
    },
    description: {
      en: String(body.descEn || body.description?.en || ""),
      fr: String(body.descFr || body.description?.fr || ""),
      es: String(body.descEs || body.description?.es || ""),
    },
    icon: String(body.icon || "🧶"),
  };
  const saved = await upsertCategory(category);
  return NextResponse.json({ category: saved });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const id = String(body.id || "");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const { categories } = await readSiteContent();
  const existing = categories.find((c) => c.id === id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const category: Category = {
    ...existing,
    slug: body.slug ? slugify(String(body.slug)) : existing.slug,
    name: {
      en: body.nameEn ?? existing.name.en,
      fr: body.nameFr ?? existing.name.fr,
      es: body.nameEs ?? existing.name.es,
    },
    description: {
      en: body.descEn ?? existing.description.en,
      fr: body.descFr ?? existing.description.fr,
      es: body.descEs ?? existing.description.es,
    },
    icon: body.icon ?? existing.icon,
  };
  const saved = await upsertCategory(category);
  return NextResponse.json({ category: saved });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const id = String(body.id || "");
  const ok = await deleteCategory(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// silence unused
void emptyLocalized;
