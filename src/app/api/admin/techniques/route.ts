import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { savePublicAsset } from "@/lib/storage/assets";
import {
  deleteTechnique,
  listTechniques,
  upsertTechnique,
} from "@/lib/data/techniques-store";
import { emptyLocalized } from "@/types";
import type { Technique, TechniqueStep } from "@/types/techniques";

export const runtime = "nodejs";

export async function GET() {
  const techniques = await listTechniques();
  return NextResponse.json({ techniques });
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Sheet upload: multipart with techniqueId + file
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const techniqueId = String(form.get("techniqueId") || "");
      const file = form.get("file");
      if (!techniqueId || !(file instanceof File)) {
        return NextResponse.json(
          { error: "techniqueId and file required" },
          { status: 400 }
        );
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const ext =
        file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : "jpg";
      const sheetPath = await savePublicAsset(
        `techniques/${techniqueId}/sheet-upload-${randomUUID().slice(0, 8)}.${ext}`,
        buf,
        file.type || "image/jpeg"
      );
      const updated = await upsertTechnique({ id: techniqueId, sheetPath });
      return NextResponse.json({ ok: true, sheetPath, technique: updated });
    }

    const body = (await request.json()) as Partial<Technique>;
    const created = await upsertTechnique({
      slug: body.slug,
      key: body.key,
      sortOrder: body.sortOrder,
      published: body.published,
      title: body.title || emptyLocalized(body.slug || "Technique"),
      tip: body.tip || emptyLocalized(""),
      youtubeUrl: body.youtubeUrl || "",
      youtubeStartSeconds:
        typeof body.youtubeStartSeconds === "number"
          ? body.youtubeStartSeconds
          : undefined,
      youtubeEndSeconds:
        typeof body.youtubeEndSeconds === "number"
          ? body.youtubeEndSeconds
          : undefined,
      sheetCols: body.sheetCols ?? 2,
      sheetRows: body.sheetRows ?? 2,
      steps: body.steps as TechniqueStep[] | undefined,
    });
    return NextResponse.json({ technique: created });
  } catch (error) {
    console.error("techniques POST:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Technique> & { id: string };
    if (!body.id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const updated = await upsertTechnique(body);
    return NextResponse.json({ technique: updated });
  } catch (error) {
    console.error("techniques PATCH:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const ok = await deleteTechnique(body.id);
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
