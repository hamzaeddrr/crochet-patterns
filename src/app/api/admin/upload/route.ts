import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { savePublicAsset } from "@/lib/storage/assets";

export const runtime = "nodejs";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: "Use JPEG, PNG, WebP, or GIF" },
        { status: 400 }
      );
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Max 8MB" }, { status: 400 });
    }

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";
    const name = `site/hero-${randomUUID().slice(0, 8)}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const stored = await savePublicAsset(name, buf, file.type);
    return NextResponse.json({ ok: true, path: stored });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
