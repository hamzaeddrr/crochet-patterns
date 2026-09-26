"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Crop,
  GraduationCap,
  Layers,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { TechniqueManualCropper } from "@/components/admin/TechniqueManualCropper";
import type { Locale } from "@/i18n/routing";
import type { Technique, TechniqueStep } from "@/types/techniques";
import { emptyLocalized } from "@/types";
import { cn } from "@/lib/utils";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "es", label: "ES" },
];

function emptyTechnique(): Technique {
  return {
    id: "",
    slug: "",
    key: "",
    sortOrder: 100,
    published: false,
    title: emptyLocalized(""),
    tip: emptyLocalized(""),
    referenceText: "",
    youtubeUrl: "",
    youtubeStartSeconds: undefined,
    youtubeEndSeconds: undefined,
    youtubeShortUrl: "",
    youtubeShortStartSeconds: undefined,
    youtubeShortEndSeconds: undefined,
    sheetCols: 2,
    sheetRows: 2,
    showSheetOnPage: false,
    steps: [],
    bonusImages: [],
    updatedAt: "",
  };
}

export default function AdminTechniquesPage() {
  const [list, setList] = useState<Technique[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Technique>(emptyTechnique());
  const [locale, setLocale] = useState<Locale>("en");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [batchSheets, setBatchSheets] = useState<1 | 2 | 3>(3);
  const [batchSheetPaths, setBatchSheetPaths] = useState<string[]>([]);
  const [manualCropOpen, setManualCropOpen] = useState(false);

  const selected = useMemo(
    () => list.find((t) => t.id === selectedId) || null,
    [list, selectedId]
  );

  async function load(opts?: { keepForm?: boolean }) {
    const res = await fetch("/api/admin/techniques");
    const data = await res.json();
    const techniques = (data.techniques || []) as Technique[];
    setList(techniques);
    if (opts?.keepForm) return;
    if (selectedId) {
      const still = techniques.find((t) => t.id === selectedId);
      if (still) setForm(still);
    }
  }

  function applyTechnique(technique: Technique) {
    setForm(technique);
    setSelectedId(technique.id);
    setList((prev) => {
      const idx = prev.findIndex((t) => t.id === technique.id);
      if (idx < 0) return [...prev, technique].sort((a, b) => a.sortOrder - b.sortOrder);
      const next = [...prev];
      next[idx] = technique;
      return next;
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function select(t: Technique) {
    setSelectedId(t.id);
    setForm({ ...t });
    setMsg("");
    setCustomPrompt("");
  }

  function startNew() {
    setSelectedId(null);
    setForm(emptyTechnique());
    setMsg("");
  }

  async function save() {
    setBusy("save");
    setMsg("");
    try {
      const isNew = !form.id;
      const res = await fetch("/api/admin/techniques", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isNew
            ? {
                slug: form.slug || form.key || "technique",
                key: form.key || form.slug,
                sortOrder: form.sortOrder,
                published: form.published,
                title: form.title,
                tip: form.tip,
                referenceText: form.referenceText || "",
                youtubeUrl: form.youtubeUrl,
                youtubeStartSeconds: form.youtubeStartSeconds,
                youtubeEndSeconds: form.youtubeEndSeconds,
                youtubeShortUrl: form.youtubeShortUrl,
                youtubeShortStartSeconds: form.youtubeShortStartSeconds,
                youtubeShortEndSeconds: form.youtubeShortEndSeconds,
                sheetCols: form.sheetCols,
                sheetRows: form.sheetRows,
                steps: form.steps,
                bonusImages: form.bonusImages || [],
              }
            : form
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      applyTechnique(data.technique);
      setMsg("Saved");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function generateStepsFromReference() {
    if (!form.id) {
      setMsg("Save the technique first");
      return;
    }
    const referenceText = (form.referenceText || "").trim();
    if (!referenceText) {
      setMsg("Paste or write reference text first");
      return;
    }
    setBusy("gen-steps");
    setMsg("Generating steps from your reference…");
    try {
      // Persist reference text first so it survives regeneration
      await fetch("/api/admin/techniques", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          referenceText,
          published: form.published,
        }),
      });
      const res = await fetch("/api/admin/techniques/generate-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          techniqueId: form.id,
          referenceText,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ||
            `Generate failed (${res.status})`
        );
      }
      if (!data.technique) throw new Error("No technique returned");
      applyTechnique(data.technique);
      setMsg(
        data.message ||
          `Generated ${data.stepCount || data.technique.steps.length} steps (still draft)`
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not generate steps");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!form.id || !confirm("Delete this technique?")) return;
    setBusy("delete");
    await fetch("/api/admin/techniques", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: form.id }),
    });
    setSelectedId(null);
    setForm(emptyTechnique());
    setBusy(null);
    await load({ keepForm: true });
  }

  async function uploadSheet(file: File) {
    if (!form.id) {
      setMsg("Save the technique first, then upload a sheet");
      return;
    }
    setBusy("upload");
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("techniqueId", form.id);
      fd.append("kind", "sheet");
      fd.append("file", file);
      const res = await fetch("/api/admin/techniques", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      applyTechnique(data.technique);
      setMsg(
        "Sheet uploaded — set cols × rows to match your grid, then Crop to steps"
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function uploadStepImage(stepIndex: number, file: File) {
    if (!form.id) {
      setMsg("Save the technique first, then upload a step photo");
      return;
    }
    setBusy(`step-${stepIndex}`);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("techniqueId", form.id);
      fd.append("kind", "step");
      fd.append("stepIndex", String(stepIndex));
      fd.append("file", file);
      const res = await fetch("/api/admin/techniques", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Step upload failed");
      applyTechnique(data.technique);
      setMsg(`Step ${stepIndex + 1} photo uploaded`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Step upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function batchIllustrate() {
    setBusy("batch");
    setBatchSheetPaths([]);
    setMsg(
      `Batch illustrating with up to ${batchSheets} AI sheet(s) — packing multiple techniques per image…`
    );
    try {
      const res = await fetch("/api/admin/techniques/batch-illustrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxSheets: batchSheets,
          cols: 4,
          rows: 3,
          onlyMissing: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ||
            `Batch failed (${res.status})`
        );
      }
      const techniques = (data.techniques || []) as Technique[];
      if (techniques.length) {
        setList(techniques);
      } else {
        await load({ keepForm: true });
      }

      const paths = Array.isArray(data.sheetPaths)
        ? (data.sheetPaths as string[])
        : [];
      setBatchSheetPaths(paths);

      const updatedIds = Array.isArray(data.techniqueIds)
        ? (data.techniqueIds as string[])
        : [];
      const firstId = updatedIds[0] || selectedId;
      if (firstId && techniques.length) {
        const still = techniques.find((t) => t.id === firstId);
        if (still) {
          setSelectedId(still.id);
          setForm(still);
        }
      }

      setMsg(
        data.message ||
          (updatedIds.length
            ? `Updated ${updatedIds.length} techniques — select one in the list to see step images.`
            : "Batch finished with no updates")
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Batch illustration failed");
    } finally {
      setBusy(null);
    }
  }

  async function autoIllustrate() {
    if (!form.id) {
      setMsg("Save the technique first");
      return;
    }
    setBusy("auto");
    setMsg(
      "Creating professional illustrations (this can take a few minutes)…"
    );
    try {
      const res = await fetch("/api/admin/techniques/auto-illustrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          techniqueId: form.id,
          cols: form.sheetCols,
          rows: form.sheetRows,
          maxAttempts: 3,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ||
            `Illustration failed (${res.status})`
        );
      }
      if (!data.technique) {
        throw new Error("No technique returned");
      }
      applyTechnique(data.technique);
      setMsg(data.message || "Professional illustrations ready");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Illustration failed");
    } finally {
      setBusy(null);
    }
  }

  async function generateSheet() {
    if (!form.id) {
      setMsg("Save the technique first");
      return;
    }
    setBusy("generate");
    setMsg("Generating storyboard sheet…");
    try {
      const res = await fetch("/api/admin/techniques/generate-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          techniqueId: form.id,
          cols: form.sheetCols,
          rows: form.sheetRows,
          customPrompt: customPrompt || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generate failed");
      if (!data.technique) throw new Error("Generate returned no technique");
      applyTechnique(data.technique);
      setMsg(`Sheet generated (${data.model}) — click Crop to steps`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setBusy(null);
    }
  }

  async function cropSheet() {
    if (!form.id) {
      setMsg("Save the technique first");
      return;
    }
    if (!form.sheetPath) {
      setMsg("Generate or upload a sheet first");
      return;
    }
    setBusy("crop");
    setMsg("Cropping panels…");
    try {
      const res = await fetch("/api/admin/techniques/crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          techniqueId: form.id,
          cols: form.sheetCols,
          rows: form.sheetRows,
          sheetPath: form.sheetPath,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error || `Crop failed (${res.status})`
        );
      }
      if (!data.technique) {
        throw new Error("Crop returned no technique data");
      }
      applyTechnique(data.technique);
      const n = Array.isArray(data.paths) ? data.paths.length : 0;
      const stepN = Number(data.stepAssigned) || 0;
      const bonusN = Number(data.bonusAssigned) || 0;
      setMsg(
        n
          ? `Cropped ${n} panels → ${stepN} to steps${
              bonusN ? `, ${bonusN} to bonus` : ""
            }`
          : "Crop finished but no paths returned"
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Crop failed");
    } finally {
      setBusy(null);
    }
  }

  async function manualCropRegion(region: {
    x: number;
    y: number;
    width: number;
    height: number;
    target: "auto" | "bonus" | number;
  }) {
    if (!form.id || !form.sheetPath) {
      throw new Error("Save the technique and upload a sheet first");
    }
    const res = await fetch("/api/admin/techniques/crop-region", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        techniqueId: form.id,
        sheetPath: form.sheetPath,
        ...region,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        (data as { error?: string }).error || `Crop failed (${res.status})`
      );
    }
    if (!data.technique) throw new Error("Crop returned no technique");
    applyTechnique(data.technique);
    const where =
      data.assigned === "bonus"
        ? "bonus images"
        : `step ${Number(data.assigned) + 1}`;
    setMsg(`Manual crop saved → ${where}`);
  }

  async function clearStepImage(stepIndex: number) {
    if (!form.id) {
      setMsg("Save the technique first");
      return;
    }
    setBusy(`clear-step-${stepIndex}`);
    setMsg("");
    try {
      const steps = form.steps.map((s, i) => {
        if (i !== stepIndex) return s;
        return { caption: s.caption, body: s.body };
      });
      const res = await fetch("/api/admin/techniques", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: form.id, steps }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not clear image");
      applyTechnique(data.technique);
      setMsg(`Step ${stepIndex + 1} image removed — upload or crop a replacement`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not clear image");
    } finally {
      setBusy(null);
    }
  }

  async function deleteBonusImage(index: number) {
    if (!form.id) return;
    setBusy(`clear-bonus-${index}`);
    try {
      const bonusImages = (form.bonusImages || []).filter((_, i) => i !== index);
      const res = await fetch("/api/admin/techniques", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: form.id, bonusImages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete bonus image");
      applyTechnique(data.technique);
      setMsg("Bonus image removed");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not delete bonus image");
    } finally {
      setBusy(null);
    }
  }

  async function useBonusOnStep(bonusIndex: number, stepIndex: number) {
    if (!form.id) return;
    const path = form.bonusImages?.[bonusIndex];
    if (!path) return;
    setBusy(`promo-bonus-${bonusIndex}`);
    try {
      const steps = form.steps.map((s, i) =>
        i === stepIndex ? { ...s, imagePath: path } : s
      );
      const bonusImages = (form.bonusImages || []).filter(
        (_, i) => i !== bonusIndex
      );
      const res = await fetch("/api/admin/techniques", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: form.id, steps, bonusImages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not assign bonus");
      applyTechnique(data.technique);
      setMsg(`Bonus image moved to step ${stepIndex + 1}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not assign bonus");
    } finally {
      setBusy(null);
    }
  }

  function updateStep(i: number, patch: Partial<TechniqueStep>) {
    setForm((f) => ({
      ...f,
      steps: f.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  }

  function addStep() {
    setForm((f) => ({
      ...f,
      steps: [
        ...f.steps,
        {
          caption: emptyLocalized(`Step ${f.steps.length + 1}`),
          body: emptyLocalized(""),
        },
      ],
    }));
  }

  function removeStep(i: number) {
    setForm((f) => ({
      ...f,
      steps: f.steps.filter((_, idx) => idx !== i),
    }));
  }

  return (
    <AdminShell title="Technique tutorials">
      <p className="mb-4 max-w-3xl text-sm text-slate-400">
        All techniques start as <span className="text-amber-200">draft</span>.
        Paste reference text → generate steps → upload photos → switch to{" "}
        <span className="text-emerald-300">Live</span> when ready. Only live
        techniques appear on /learn and in Pattern Studio.
      </p>

      <section className="mb-6 space-y-3 rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
              <Layers className="h-4 w-4" />
              Batch illustrate (low cost)
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-slate-400">
              Packs several techniques into shared 4×3 storyboard sheets, crops
              each panel, and assigns them to the right steps. Only techniques
              still missing step art. Run again for the next batch if some were
              skipped.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs text-slate-400">
              Max AI images
              <select
                value={batchSheets}
                onChange={(e) =>
                  setBatchSheets(Number(e.target.value) as 1 | 2 | 3)
                }
                className="mt-1 block rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-white"
              >
                <option value={1}>1 sheet</option>
                <option value={2}>2 sheets</option>
                <option value={3}>3 sheets</option>
              </select>
            </label>
            <button
              type="button"
              disabled={!!busy}
              onClick={batchIllustrate}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              <Layers className="h-4 w-4" />
              {busy === "batch"
                ? "Batch running…"
                : `Batch fill (≤${batchSheets} images)`}
            </button>
          </div>
        </div>
        {msg && busy === "batch" ? (
          <p className="text-sm text-emerald-200">{msg}</p>
        ) : null}
        {msg && !busy && /sheet|batch|panel|techniques updated|Updated/i.test(msg) ? (
          <p className="rounded-lg bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
            {msg}
          </p>
        ) : null}
        {batchSheetPaths.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {batchSheetPaths.map((src, i) => (
              <div
                key={src}
                className="overflow-hidden rounded-lg border border-slate-700 bg-slate-950"
              >
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Batch sheet {i + 1}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Batch sheet ${i + 1}`}
                  className="max-h-48 w-full object-contain"
                />
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-2">
          <button
            type="button"
            onClick={startNew}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-rose-400/50 hover:text-white"
          >
            <Plus className="h-4 w-4" /> New technique
          </button>
          {list.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => select(t)}
              className={cn(
                "flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm",
                selectedId === t.id
                  ? "bg-rose-500/20 text-rose-100"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              )}
            >
              <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {t.title.en || t.slug}
                </span>
                <span className="text-[11px] text-slate-500">
                  {t.key} · {t.published ? "live" : "draft"}
                  {t.published
                    ? ""
                    : t.steps.some((s) => s.imagePath)
                      ? " · has photos"
                      : t.steps.length
                        ? ` · ${t.steps.length} steps`
                        : " · no steps yet"}
                </span>
              </span>
            </button>
          ))}
        </aside>

        <div className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-white">
              {form.id ? "Edit technique" : "New technique"}
            </h2>
            <div className="flex gap-1 rounded-lg bg-slate-950 p-1">
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLocale(l.code)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-bold",
                    locale === l.code
                      ? "bg-slate-700 text-white"
                      : "text-slate-500"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-slate-400">
              Title ({locale})
              <input
                value={form.title[locale]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: { ...form.title, [locale]: e.target.value },
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm text-slate-400">
              Tip ({locale})
              <input
                value={form.tip[locale]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tip: { ...form.tip, [locale]: e.target.value },
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm text-slate-400">
              Slug
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                placeholder="magic-ring"
              />
            </label>
            <label className="block text-sm text-slate-400">
              Studio key
              <input
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                placeholder="magic_ring | sc | inc | dec | fo"
              />
            </label>
            <label className="block text-sm text-slate-400 sm:col-span-2">
              YouTube URL — main video (landscape)
              <input
                value={form.youtubeUrl || ""}
                onChange={(e) =>
                  setForm({ ...form, youtubeUrl: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                placeholder="https://www.youtube.com/watch?v=…"
              />
            </label>
            <label className="block text-sm text-slate-400">
              Start (seconds)
              <input
                type="number"
                min={0}
                value={form.youtubeStartSeconds ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    youtubeStartSeconds: e.target.value
                      ? Math.max(0, Number(e.target.value))
                      : undefined,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                placeholder="e.g. 45 — skip intro"
              />
            </label>
            <label className="block text-sm text-slate-400">
              End (seconds)
              <input
                type="number"
                min={0}
                value={form.youtubeEndSeconds ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    youtubeEndSeconds: e.target.value
                      ? Math.max(0, Number(e.target.value))
                      : undefined,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                placeholder="e.g. 180 — stop before outro"
              />
            </label>
            <label className="block text-sm text-slate-400 sm:col-span-2">
              YouTube Shorts URL — 2nd video (optional, vertical)
              <input
                value={form.youtubeShortUrl || ""}
                onChange={(e) =>
                  setForm({ ...form, youtubeShortUrl: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                placeholder="https://www.youtube.com/shorts/… or watch URL"
              />
            </label>
            <label className="block text-sm text-slate-400">
              Short start (seconds)
              <input
                type="number"
                min={0}
                value={form.youtubeShortStartSeconds ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    youtubeShortStartSeconds: e.target.value
                      ? Math.max(0, Number(e.target.value))
                      : undefined,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm text-slate-400">
              Short end (seconds)
              <input
                type="number"
                min={0}
                value={form.youtubeShortEndSeconds ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    youtubeShortEndSeconds: e.target.value
                      ? Math.max(0, Number(e.target.value))
                      : undefined,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <p className="sm:col-span-2 text-xs text-slate-500">
              Official YouTube embeds only. Main video is 16:9; Shorts show in a
              9:16 frame. Start/end skip bumpers — do not re-upload trimmed
              copies of other creators&apos; videos.
            </p>
            <label className="block text-sm text-slate-400 sm:col-span-2">
              Status
              <div className="mt-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, published: false })}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium",
                    !form.published
                      ? "bg-amber-600 text-white"
                      : "border border-slate-700 text-slate-300 hover:bg-slate-800"
                  )}
                >
                  Draft
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, published: true })}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium",
                    form.published
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-700 text-slate-300 hover:bg-slate-800"
                  )}
                >
                  Live
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Draft stays off /learn and studio. Switch to Live when photos +
                steps are ready.
              </p>
            </label>
            <label className="block text-sm text-slate-400">
              Sort order
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sortOrder: Number(e.target.value) || 0,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
          </div>

          <section className="space-y-3 rounded-lg border border-sky-900/40 bg-sky-950/20 p-4">
            <h3 className="text-sm font-medium text-sky-100">
              Reference text → AI steps
            </h3>
            <p className="text-xs text-slate-400">
              Paste notes (from any guide you studied, your own wording, or a
              rough outline). AI turns them into clear EN/FR/ES step captions —
              then upload photos per step. Does not copy third-party images.
            </p>
            <textarea
              value={form.referenceText || ""}
              onChange={(e) =>
                setForm({ ...form, referenceText: e.target.value })
              }
              rows={8}
              placeholder="Paste or write how this technique works, step by step…"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600"
            />
            <button
              type="button"
              disabled={!!busy || !form.id}
              onClick={generateStepsFromReference}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              <Wand2 className="h-4 w-4" />
              {busy === "gen-steps"
                ? "Generating steps…"
                : "Generate steps from text"}
            </button>
            {!form.id ? (
              <p className="text-xs text-amber-200/80">
                Save the technique once before generating steps.
              </p>
            ) : null}
          </section>

          <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <h3 className="text-sm font-medium text-slate-200">
              Storyboard sheet (1 image → many steps)
            </h3>
            <p className="text-xs text-slate-500">
              Prefer{" "}
              <span className="text-slate-300">Create professional illustrations</span>
              : builds a Loopcraft-style multi-panel sheet, crops steps, and
              silently refines until the art is clear enough for beginners. No
              scores — just finished tutorial art for /learn and Pattern Studio.
            </p>
            <div className="flex flex-wrap gap-3">
              <label className="text-sm text-slate-400">
                Cols
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={form.sheetCols}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sheetCols: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className="mt-1 w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-white"
                />
              </label>
              <label className="text-sm text-slate-400">
                Rows
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={form.sheetRows}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sheetRows: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className="mt-1 w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-white"
                />
              </label>
              <p className="self-end text-xs text-slate-500">
                Grid cells: {form.sheetCols * form.sheetRows} · steps:{" "}
                {form.steps.length}
              </p>
            </div>

            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              placeholder="Optional custom prompt (leave blank to auto-build from step text)"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!!busy || !form.id}
                onClick={autoIllustrate}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                <Wand2 className="h-4 w-4" />
                {busy === "auto"
                  ? "Creating illustrations…"
                  : "Create professional illustrations"}
              </button>
              <button
                type="button"
                disabled={!!busy || !form.id}
                onClick={generateSheet}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                <Sparkles className="h-4 w-4" />
                {busy === "generate" ? "Generating…" : "Generate sheet only"}
              </button>
            </div>

            <div className="rounded-lg border border-slate-700/80 bg-slate-950/50 p-3 space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Your own images
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Upload a multi-panel sheet, set cols × rows, then auto-crop —
                  or open manual crop and draw boxes. Extra panels become bonus
                  images.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800">
                  <Upload className="h-4 w-4" />
                  Upload sheet / collage
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={!!busy || !form.id}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadSheet(f);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  disabled={!!busy || !form.id || !form.sheetPath}
                  onClick={cropSheet}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-700/60 bg-emerald-950/40 px-3 py-2 text-sm font-medium text-emerald-200 disabled:opacity-40"
                >
                  <Crop className="h-4 w-4" />
                  {busy === "crop" ? "Cropping…" : "Auto-crop grid"}
                </button>
                <button
                  type="button"
                  disabled={!!busy || !form.id || !form.sheetPath}
                  onClick={() => setManualCropOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-sky-700/60 bg-sky-950/40 px-3 py-2 text-sm font-medium text-sky-200 disabled:opacity-40"
                >
                  <Crop className="h-4 w-4" />
                  Manual crop
                </button>
              </div>
              {form.sheetPath ? (
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={Boolean(form.showSheetOnPage)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        showSheetOnPage: e.target.checked,
                      })
                    }
                  />
                  Show full sheet on /learn page (beside video when both exist)
                </label>
              ) : null}
            </div>

            {msg &&
            (busy === "crop" ||
              busy === "generate" ||
              busy === "upload" ||
              busy === "auto" ||
              busy?.startsWith("step-") ||
              /crop|sheet|panel|upload|generat|illustrat|ready|refin|photo/i.test(
                msg
              )) ? (
              <p
                className={cn(
                  "rounded-lg px-3 py-2 text-sm",
                  /fail|error|could not|not found|required/i.test(msg)
                    ? "bg-rose-950/50 text-rose-200"
                    : "bg-emerald-950/40 text-emerald-200"
                )}
              >
                {msg}
              </p>
            ) : null}

            {form.sheetPath ? (
              <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.sheetPath}
                  alt="Storyboard sheet"
                  className="mx-auto max-h-72 w-auto object-contain"
                />
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No sheet yet — generate with AI or upload a multi-panel image.
              </p>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-200">Steps</h3>
              <button
                type="button"
                onClick={addStep}
                className="text-xs font-medium text-rose-300 hover:text-rose-200"
              >
                + Add step
              </button>
            </div>
            {form.steps.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-700 px-3 py-6 text-center text-sm text-slate-500">
                No steps yet — paste reference text above and generate, or add
                steps manually.
              </p>
            ) : null}
            {form.steps.map((step, i) => (
              <div
                key={i}
                className="grid gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 sm:grid-cols-[120px_1fr]"
              >
                <div className="overflow-hidden rounded-md border border-slate-800 bg-slate-900">
                  {step.imagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={step.imagePath}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center text-[10px] text-slate-600">
                      No image
                    </div>
                  )}
                  <div className="flex border-t border-slate-800">
                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 bg-slate-950/80 py-1.5 text-[10px] font-medium text-slate-400 hover:bg-slate-900 hover:text-slate-200">
                      <Upload className="h-3 w-3" />
                      {busy === `step-${i}` ? "…" : "Upload"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={!!busy || !form.id}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadStepImage(i, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {step.imagePath ? (
                      <button
                        type="button"
                        disabled={!!busy || !form.id}
                        onClick={() => clearStepImage(i)}
                        className="flex flex-1 items-center justify-center gap-1 border-l border-slate-800 bg-slate-950/80 py-1.5 text-[10px] font-medium text-rose-300/90 hover:bg-rose-950/40 disabled:opacity-40"
                      >
                        <Trash2 className="h-3 w-3" />
                        {busy === `clear-step-${i}` ? "…" : "Delete"}
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Step {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      className="text-slate-500 hover:text-rose-300"
                      aria-label="Remove step"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    value={step.caption[locale]}
                    onChange={(e) =>
                      updateStep(i, {
                        caption: {
                          ...step.caption,
                          [locale]: e.target.value,
                        },
                      })
                    }
                    placeholder="Caption"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-white"
                  />
                  <textarea
                    value={step.body[locale]}
                    onChange={(e) =>
                      updateStep(i, {
                        body: { ...step.body, [locale]: e.target.value },
                      })
                    }
                    rows={2}
                    placeholder="Full instruction"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-white"
                  />
                </div>
              </div>
            ))}
          </section>

          {(form.bonusImages?.length || 0) > 0 ? (
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-slate-200">
                  Bonus images
                </h3>
                <p className="text-xs text-slate-500">
                  Extra crops that did not fit into steps. Assign one to a step
                  or delete it.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(form.bonusImages || []).map((src, bi) => (
                  <div
                    key={`${src}-${bi}`}
                    className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <div className="flex flex-wrap items-center gap-2 p-2">
                      <select
                        className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                        defaultValue=""
                        disabled={!!busy}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "") return;
                          useBonusOnStep(bi, Number(v));
                          e.target.value = "";
                        }}
                      >
                        <option value="">Move to step…</option>
                        {form.steps.map((s, si) => (
                          <option key={si} value={si}>
                            Step {si + 1}
                            {s.caption.en ? ` — ${s.caption.en}` : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() => deleteBonusImage(bi)}
                        className="rounded-md border border-rose-900/50 px-2 py-1 text-xs text-rose-300 hover:bg-rose-950/40"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              disabled={!!busy}
              onClick={save}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-40"
            >
              {busy === "save" ? "Saving…" : "Save"}
            </button>
            {form.id ? (
              <button
                type="button"
                disabled={!!busy}
                onClick={remove}
                className="rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-rose-950/40"
              >
                Delete
              </button>
            ) : null}
            {msg ? (
              <p
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-sm sm:w-auto",
                  /fail|error|could not|not found|required/i.test(msg)
                    ? "bg-rose-950/50 text-rose-200"
                    : /cropp|saved|generated|uploaded|panels/i.test(msg)
                      ? "bg-emerald-950/40 text-emerald-200"
                      : "bg-slate-800 text-slate-300"
                )}
              >
                {msg}
              </p>
            ) : null}
            {selected ? (
              <a
                href={`/learn/${selected.slug}`}
                target="_blank"
                rel="noreferrer"
                className="ml-auto text-xs text-slate-500 hover:text-slate-300"
              >
                Preview /learn/{selected.slug}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {manualCropOpen && form.sheetPath ? (
        <TechniqueManualCropper
          sheetPath={form.sheetPath}
          stepCount={form.steps.length}
          stepLabels={form.steps.map((s) => s.caption.en || "")}
          onClose={() => setManualCropOpen(false)}
          onCrop={manualCropRegion}
        />
      ) : null}
    </AdminShell>
  );
}
