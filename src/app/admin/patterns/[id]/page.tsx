"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import type { CrochetPattern, PatternStatus } from "@/types";

export default function AdminPatternDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pattern, setPattern] = useState<CrochetPattern | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [summaryEn, setSummaryEn] = useState("");
  const [seoTitleEn, setSeoTitleEn] = useState("");
  const [seoDescEn, setSeoDescEn] = useState("");
  const [priceCents, setPriceCents] = useState("499");

  useEffect(() => {
    fetch(`/api/admin/patterns/${id}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Not found");
        setPattern(data.pattern);
        setTitleEn(data.pattern.content.title.en);
        setSummaryEn(data.pattern.content.summary.en);
        setSeoTitleEn(data.pattern.content.seoTitle.en);
        setSeoDescEn(data.pattern.content.seoDescription.en);
        setPriceCents(String(data.pattern.priceCents ?? 499));
      })
      .catch((e) => setError(e.message));
  }, [id]);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/admin/patterns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    setPattern(data.pattern);
    setMessage("Saved");
  }

  async function saveCopy() {
    if (!pattern) return;
    await patch({
      priceCents: Number(priceCents) || 0,
      content: {
        ...pattern.content,
        title: { ...pattern.content.title, en: titleEn },
        summary: { ...pattern.content.summary, en: summaryEn },
        seoTitle: { ...pattern.content.seoTitle, en: seoTitleEn },
        seoDescription: { ...pattern.content.seoDescription, en: seoDescEn },
      },
    });
  }

  async function rebuildPdf() {
    setSaving(true);
    const res = await fetch(`/api/admin/patterns/${id}/pdf`, { method: "POST" });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "PDF failed");
      return;
    }
    setPattern(data.pattern);
    setMessage("PDF rebuilt");
  }

  async function revalidate() {
    setSaving(true);
    const res = await fetch(`/api/admin/patterns/${id}/validate`, {
      method: "POST",
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Validate failed");
      return;
    }
    setPattern(data.pattern);
    setMessage(
      data.pattern.validation.ok
        ? "Validation OK"
        : `${data.pattern.validation.issues.length} issues`
    );
  }

  async function retranslate() {
    setSaving(true);
    await patch({ action: "retranslate" });
    setSaving(false);
  }

  async function regenImage() {
    setSaving(true);
    setMessage("Regenerating image…");
    await patch({ action: "regenerateImage" });
    setSaving(false);
  }

  async function remove() {
    if (!confirm("Delete this pattern?")) return;
    await fetch(`/api/admin/patterns/${id}`, { method: "DELETE" });
    router.push("/admin/patterns");
  }

  if (error && !pattern) {
    return (
      <AdminShell title="Pattern">
        <p className="text-rose-400">{error}</p>
      </AdminShell>
    );
  }

  if (!pattern) {
    return (
      <AdminShell title="Pattern">
        <p className="text-slate-400">Loading…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={pattern.content.title.en}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/patterns" className="text-sm text-slate-400">
          ← Library
        </Link>
        {message && <span className="text-sm text-emerald-400">{message}</span>}
        {error && <span className="text-sm text-rose-400">{error}</span>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            {pattern.imagePath ? (
              <Image
                src={pattern.imagePath}
                alt=""
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-600">
                No image
              </div>
            )}
          </div>
          <label className="block text-sm text-slate-400">
            Status
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={pattern.status}
              onChange={(e) =>
                patch({ status: e.target.value as PatternStatus })
              }
            >
              {(
                [
                  "draft",
                  "reviewed",
                  "tested",
                  "published",
                  "archived",
                ] as PatternStatus[]
              ).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={pattern.featured}
              onChange={(e) => patch({ featured: e.target.checked })}
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={pattern.free}
              onChange={(e) => patch({ free: e.target.checked })}
            />
            Free download
          </label>
          <label className="block text-sm text-slate-400">
            Price (cents)
            <input
              type="number"
              value={priceCents}
              onChange={(e) => setPriceCents(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </label>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={saveCopy}
              className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-bold text-white"
            >
              Save copy & price
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={revalidate}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900"
            >
              Re-run stitch validation
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={retranslate}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900"
            >
              Re-translate FR/ES
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={regenImage}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900"
            >
              Regenerate image
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={rebuildPdf}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900"
            >
              Rebuild PDF
            </button>
            {pattern.pdfPath && (
              <a
                href={pattern.pdfPath}
                target="_blank"
                className="rounded-lg bg-slate-800 px-3 py-2 text-center text-sm font-bold text-white"
              >
                Open PDF (admin)
              </a>
            )}
            {pattern.status === "published" && (
              <a
                href={`/patterns/${pattern.slug}`}
                target="_blank"
                className="text-center text-sm text-rose-300"
              >
                View on site →
              </a>
            )}
            <button
              type="button"
              onClick={remove}
              className="text-sm text-rose-400 hover:text-rose-300"
            >
              Delete pattern
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="font-semibold text-white">Copy & SEO (EN)</h2>
            <input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="Title"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            />
            <textarea
              value={summaryEn}
              onChange={(e) => setSummaryEn(e.target.value)}
              rows={3}
              placeholder="Summary"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            />
            <input
              value={seoTitleEn}
              onChange={(e) => setSeoTitleEn(e.target.value)}
              placeholder="SEO title"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            />
            <textarea
              value={seoDescEn}
              onChange={(e) => setSeoDescEn(e.target.value)}
              rows={2}
              placeholder="SEO description"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            />
            <p className="text-xs text-slate-500">
              FR: {pattern.content.title.fr || "—"} · ES:{" "}
              {pattern.content.title.es || "—"}
            </p>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="font-semibold text-white">Design spec</h2>
            <pre className="mt-3 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-300">
              {JSON.stringify(pattern.designSpec, null, 2)}
            </pre>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="font-semibold text-white">
              Validation{" "}
              {pattern.validation.ok ? (
                <span className="text-emerald-400">✓</span>
              ) : (
                <span className="text-amber-400">⚠</span>
              )}
            </h2>
            {pattern.validation.issues.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">No issues detected.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-amber-200">
                {pattern.validation.issues.map((issue, i) => (
                  <li key={i}>
                    [{issue.componentId} rnd {issue.round}] {issue.message}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs capitalize text-slate-500">
              Confidence: {pattern.confidence}
            </p>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="font-semibold text-white">Pattern preview</h2>
            {pattern.content.components.map((c) => (
              <div key={c.id} className="mt-4">
                <h3 className="text-rose-200">{c.name}</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {c.rounds.map((r) => (
                    <li key={r.round}>
                      <span className="font-mono text-slate-500">
                        R{r.round}
                      </span>{" "}
                      {r.instructions}{" "}
                      <span className="text-slate-500">({r.result})</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
