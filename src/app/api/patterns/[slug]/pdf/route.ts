import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import { getPatternBySlug } from "@/lib/data/store";
import { isPatternUnlocked, UNLOCK_COOKIE } from "@/lib/billing/unlock";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const pattern = await getPatternBySlug(slug);
  if (!pattern || pattern.status !== "published") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!pattern.pdfPath) {
    return NextResponse.json({ error: "PDF not ready" }, { status: 404 });
  }

  if (!pattern.free) {
    const jar = await cookies();
    const token = jar.get(UNLOCK_COOKIE)?.value;
    if (!isPatternUnlocked(token, pattern.id)) {
      return NextResponse.json({ error: "Purchase required" }, { status: 403 });
    }
  }

  const abs = path.join(process.cwd(), "public", pattern.pdfPath);
  try {
    const bytes = await fs.readFile(abs);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pattern.slug}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }
}
