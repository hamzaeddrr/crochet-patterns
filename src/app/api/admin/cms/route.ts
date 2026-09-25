import { NextRequest, NextResponse } from "next/server";
import {
  getPatternById,
  readSiteContent,
  updatePage,
  upsertBlogPost,
  upsertPattern,
} from "@/lib/data/store";
import { translatePatternContent } from "@/lib/ai/translate";
import type { PageKey } from "@/types";
import { emptyLocalized } from "@/types";
import { randomUUID } from "crypto";

export async function GET() {
  const content = await readSiteContent();
  let missingFr = 0;
  let missingEs = 0;
  for (const p of content.patterns) {
    if (!p.content.title.fr || p.content.title.fr === p.content.title.en)
      missingFr++;
    if (!p.content.title.es || p.content.title.es === p.content.title.en)
      missingEs++;
  }
  return NextResponse.json({
    pages: content.pages,
    blogPosts: content.blogPosts,
    settings: content.settings,
    coverage: {
      patterns: content.patterns.length,
      missingFr,
      missingEs,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  if (body.action === "updatePage") {
    const key = body.key as PageKey;
    await updatePage(key, body.page);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "updateTagline") {
    const content = await readSiteContent();
    content.settings = {
      ...content.settings,
      tagline: body.tagline || content.settings.tagline,
      siteName: body.siteName || content.settings.siteName,
    };
    const { saveSiteContent } = await import("@/lib/data/store");
    await saveSiteContent(content);
    return NextResponse.json({ ok: true, settings: content.settings });
  }

  if (body.action === "translateMissing") {
    const content = await readSiteContent();
    let updated = 0;
    for (const p of content.patterns) {
      const needs =
        !p.content.title.fr ||
        p.content.title.fr === p.content.title.en ||
        !p.content.title.es ||
        p.content.title.es === p.content.title.en;
      if (!needs) continue;
      try {
        p.content = await translatePatternContent(p.content, false);
        p.updatedAt = new Date().toISOString();
        await upsertPattern(p);
        updated++;
      } catch (e) {
        console.warn("Translate failed for", p.id, e);
      }
    }
    return NextResponse.json({ ok: true, updated });
  }

  if (body.action === "translatePattern") {
    const pattern = await getPatternById(String(body.id));
    if (!pattern) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    pattern.content = await translatePatternContent(pattern.content, true);
    pattern.updatedAt = new Date().toISOString();
    const saved = await upsertPattern(pattern);
    return NextResponse.json({ pattern: saved });
  }

  if (body.action === "upsertBlog") {
    const now = new Date().toISOString();
    const post = {
      id: String(body.id || randomUUID()),
      slug: String(body.slug || "post"),
      title: body.title || emptyLocalized(""),
      excerpt: body.excerpt || emptyLocalized(""),
      body: body.body || emptyLocalized(""),
      seoTitle: body.seoTitle || emptyLocalized(""),
      seoDescription: body.seoDescription || emptyLocalized(""),
      status: (body.status === "published" ? "published" : "draft") as
        | "draft"
        | "published",
      createdAt: body.createdAt || now,
      updatedAt: now,
      publishedAt:
        body.status === "published" ? body.publishedAt || now : undefined,
    };
    const saved = await upsertBlogPost(post);
    return NextResponse.json({ post: saved });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
