"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Crop,
  GraduationCap,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
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
    youtubeUrl: "",
    sheetCols: 2,
    sheetRows: 2,
    steps: [
      { caption: emptyLocalized("Step 1"), body: emptyLocalized("") },
      { caption: emptyLocalized("Step 2"), body: emptyLocalized("") },
      { caption: emptyLocalized("Step 3"), body: emptyLocalized("") },
    ],
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
                youtubeUrl: form.youtubeUrl,
                sheetCols: form.sheetCols,
                sheetRows: form.sheetRows,
                steps: form.steps,
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
      fd.append("file", file);
      const res = await fetch("/api/admin/techniques", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      applyTechnique(data.technique);
      setMsg("Sheet uploaded — set cols/rows, then Crop to steps");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload failed");
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
      const withImg = (data.technique.steps || []).filter(
        (s: { imagePath?: string }) => s.imagePath
      ).length;
      setMsg(
        n
          ? `Cropped ${n} panels → ${withImg} steps now have images`
          : "Crop finished but no paths returned"
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Crop failed");
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
      <p className="mb-6 max-w-3xl text-sm text-slate-400">
        Build a stitch library like a brand guide: generate one multi-panel AI
        sheet per technique, crop panels into steps, add captions and optional
        YouTube. Published techniques appear on /learn and in Pattern Studio.
      </p>

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
              YouTube URL (optional embed)
              <input
                value={form.youtubeUrl || ""}
                onChange={(e) =>
                  setForm({ ...form, youtubeUrl: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                placeholder="https://www.youtube.com/watch?v=…"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) =>
                  setForm({ ...form, published: e.target.checked })
                }
              />
              Published on /learn + studio
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

          <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <h3 className="text-sm font-medium text-slate-200">
              Storyboard sheet (1 image → many steps)
            </h3>
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
                onClick={generateSheet}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                <Sparkles className="h-4 w-4" />
                {busy === "generate" ? "Generating…" : "Generate sheet"}
              </button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">
                <Upload className="h-4 w-4" />
                Upload sheet
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
                {busy === "crop" ? "Cropping…" : "Crop to steps"}
              </button>
            </div>

            {msg &&
            (busy === "crop" ||
              busy === "generate" ||
              busy === "upload" ||
              /crop|sheet|panel|upload|generat/i.test(msg)) ? (
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
                      No crop
                    </div>
                  )}
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
    </AdminShell>
  );
}
