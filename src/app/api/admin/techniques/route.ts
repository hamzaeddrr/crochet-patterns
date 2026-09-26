import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { savePublicAsset } from "@/lib/storage/assets";
import {
  deleteTechnique,
  getTechniqueById,
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

    // Multipart: sheet upload OR per-step image upload
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const techniqueId = String(form.get("techniqueId") || "");
      const file = form.get("file");
      const kind = String(form.get("kind") || "sheet");
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

      if (kind === "step") {
        const stepIndex = Math.max(0, Number(form.get("stepIndex")) || 0);
        const existing = await getTechniqueById(techniqueId);
        if (!existing) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (stepIndex >= existing.steps.length) {
          return NextResponse.json(
            { error: "stepIndex out of range — add the step first" },
            { status: 400 }
          );
        }
        const imagePath = await savePublicAsset(
          `techniques/${techniqueId}/step-${stepIndex}-${randomUUID().slice(0, 8)}.${ext}`,
          buf,
          file.type || "image/jpeg"
        );
        const steps = existing.steps.map((s, i) =>
          i === stepIndex ? { ...s, imagePath } : s
        );
        const updated = await upsertTechnique({
          id: techniqueId,
          steps,
        });
        return NextResponse.json({ ok: true, imagePath, technique: updated });
      }

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
      published: body.published ?? false,
      title: body.title || emptyLocalized(body.slug || "Technique"),
      tip: body.tip || emptyLocalized(""),
      referenceText: body.referenceText || "",
      youtubeUrl: body.youtubeUrl || "",
      youtubeStartSeconds:
        typeof body.youtubeStartSeconds === "number"
          ? body.youtubeStartSeconds
          : undefined,
      youtubeEndSeconds:
        typeof body.youtubeEndSeconds === "number"
          ? body.youtubeEndSeconds
          : undefined,
      youtubeShortUrl: body.youtubeShortUrl || "",
      youtubeShortStartSeconds:
        typeof body.youtubeShortStartSeconds === "number"
          ? body.youtubeShortStartSeconds
          : undefined,
      youtubeShortEndSeconds:
        typeof body.youtubeShortEndSeconds === "number"
          ? body.youtubeShortEndSeconds
          : undefined,
      sheetCols: body.sheetCols ?? 2,
      sheetRows: body.sheetRows ?? 2,
      steps: body.steps as TechniqueStep[] | undefined,
      bonusImages: body.bonusImages,
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
