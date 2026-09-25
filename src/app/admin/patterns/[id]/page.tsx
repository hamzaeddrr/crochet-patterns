"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  centsToDollarInput,
  dollarsToCents,
  type CrochetPattern,
  type PatternStatus,
} from "@/types";

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
  const [priceUsd, setPriceUsd] = useState("4.99");
  const [featured, setFeatured] = useState(false);
  const [free, setFree] = useState(false);
  const [status, setStatus] = useState<PatternStatus>("draft");

  useEffect(() => {
    fetch(`/api/admin/patterns/${id}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Not found");
        const p = data.pattern as CrochetPattern;
        setPattern(p);
        setTitleEn(p.content.title.en);
        setSummaryEn(p.content.summary.en);
        setSeoTitleEn(p.content.seoTitle.en);
        setSeoDescEn(p.content.seoDescription.en);
        setPriceUsd(centsToDollarInput(p.priceCents ?? 499));
        setFeatured(Boolean(p.featured));
        setFree(Boolean(p.free));
        setStatus(p.status);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/admin/patterns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Save failed");
        return null;
      }
      const p = data.pattern as CrochetPattern;
      setPattern(p);
      setFeatured(Boolean(p.featured));
      setFree(Boolean(p.free));
      setStatus(p.status);
      setMessage("Saved");
      return p;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function saveAll() {
    if (!pattern) return;
    const saved = await patch({
      featured,
      free,
      status,
      priceCents: dollarsToCents(Number(priceUsd)),
      currency: "usd",
      content: {
        ...pattern.content,
        title: { ...pattern.content.title, en: titleEn },
        summary: { ...pattern.content.summary, en: summaryEn },
        seoTitle: { ...pattern.content.seoTitle, en: seoTitleEn },
        seoDescription: { ...pattern.content.seoDescription, en: seoDescEn },
      },
    });
    if (saved && featured && saved.status !== "published") {
      setMessage("Saved — set status to published for Featured to appear on the homepage");
    }
  }

  async function rebuildPdf() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/patterns/${id}/pdf`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "PDF failed");
        return;
      }
      setPattern(data.pattern);
      setMessage("PDF rebuilt");
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF failed");
    } finally {
      setSaving(false);
    }
  }

  async function revalidate() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/patterns/${id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Validate failed");
    } finally {
      setSaving(false);
    }
  }

  async function autoFixStitches() {
    setSaving(true);
    setMessage("Repairing stitch ops…");
    setError("");
    try {
      const res = await fetch(`/api/admin/patterns/${id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repair: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Repair failed");
        return;
      }
      setPattern(data.pattern);
      setMessage(
        data.pattern.validation.ok
          ? `Stitch counts fixed (${data.fixed || 0} rounds). Validation OK.`
          : `Repaired ${data.fixed || 0} rounds — ${data.pattern.validation.issues.length} issues remain.`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Repair failed");
    } finally {
      setSaving(false);
    }
  }

  async function retranslate() {
    await patch({ action: "retranslate" });
  }

  async function regenImage() {
    setMessage("Regenerating image…");
    await patch({ action: "regenerateImage" });
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
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/admin/patterns" className="text-sm text-slate-400">
          ← Library
        </Link>
        <button
          type="button"
          onClick={saveAll}
          disabled={saving}
          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
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
                unoptimized={/^https?:\/\//i.test(pattern.imagePath)}
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
              value={status}
              disabled={saving}
              onChange={(e) => setStatus(e.target.value as PatternStatus)}
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
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={featured}
              disabled={saving}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            Featured on homepage
          </label>
          <p className="text-xs text-slate-500">
            Featured only shows on the site when status is{" "}
            <span className="text-slate-300">published</span>. Click{" "}
            <span className="text-slate-300">Save changes</span> after toggling.
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={free}
              disabled={saving}
              onChange={(e) => setFree(e.target.checked)}
            />
            Free download
          </label>
          <label className="block text-sm text-slate-400">
            Price (USD)
            <input
              type="number"
              min="0"
              step="0.01"
              value={priceUsd}
              disabled={saving}
              onChange={(e) => setPriceUsd(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </label>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={saveAll}
              className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-bold text-white hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={revalidate}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900 disabled:opacity-60"
            >
              Re-run stitch validation
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={autoFixStitches}
              className="rounded-lg border border-amber-700/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-100 hover:bg-amber-500/20 disabled:opacity-60"
            >
              Auto-fix stitch counts
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={retranslate}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900 disabled:opacity-60"
            >
              Re-translate FR/ES
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={regenImage}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900 disabled:opacity-60"
            >
              Regenerate image
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={rebuildPdf}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900 disabled:opacity-60"
            >
              Rebuild PDF
            </button>
            {pattern.pdfPath && (
              <a
                href={pattern.pdfPath}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-slate-800 px-3 py-2 text-center text-sm font-bold text-white"
              >
                Open PDF (admin)
              </a>
            )}
            {status === "published" && (
              <a
                href={`/patterns/${pattern.slug}`}
                target="_blank"
                rel="noreferrer"
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
              Confidence: {pattern.confidence} (admin only)
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
