"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  centsToDollarInput,
  dollarsToCents,
  emptyLocalized,
  type Category,
  type CrochetPattern,
  type LocalizedString,
  type PatternStatus,
} from "@/types";
import type { Locale } from "@/i18n/routing";

const IMAGE_PROGRESS_HINTS = [
  "Reading pattern steps…",
  "Building multi-step collage prompt…",
  "Calling image model (this can take 30–90s)…",
  "Still generating — almost there…",
  "Saving new image to storage…",
];

const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
];

function withCacheBust(url: string | undefined, version: string | number) {
  if (!url) return "";
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(String(version))}`;
}

function asLocalized(value?: LocalizedString): LocalizedString {
  return {
    en: value?.en || "",
    fr: value?.fr || "",
    es: value?.es || "",
  };
}

export default function AdminPatternDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pattern, setPattern] = useState<CrochetPattern | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [localeTab, setLocaleTab] = useState<Locale>("en");
  const [title, setTitle] = useState<LocalizedString>(emptyLocalized());
  const [summary, setSummary] = useState<LocalizedString>(emptyLocalized());
  const [seoTitle, setSeoTitle] = useState<LocalizedString>(emptyLocalized());
  const [seoDescription, setSeoDescription] =
    useState<LocalizedString>(emptyLocalized());
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [priceUsd, setPriceUsd] = useState("4.99");
  const [featured, setFeatured] = useState(false);
  const [free, setFree] = useState(false);
  const [status, setStatus] = useState<PatternStatus>("draft");
  const [imageBusy, setImageBusy] = useState(false);
  const [imageElapsed, setImageElapsed] = useState(0);
  const [imageHint, setImageHint] = useState(IMAGE_PROGRESS_HINTS[0]);
  const [imageVersion, setImageVersion] = useState(0);
  const imageElapsedRef = useRef(0);

  function applyPatternForm(p: CrochetPattern) {
    setPattern(p);
    setTitle(asLocalized(p.content.title));
    setSummary(asLocalized(p.content.summary));
    setSeoTitle(asLocalized(p.content.seoTitle));
    setSeoDescription(asLocalized(p.content.seoDescription));
    setCategoryIds(p.categoryIds || []);
    setPriceUsd(centsToDollarInput(p.priceCents ?? 499));
    setFeatured(Boolean(p.featured));
    setFree(Boolean(p.free));
    setStatus(p.status);
    setImageVersion(Date.parse(p.updatedAt) || Date.now());
  }

  useEffect(() => {
    fetch(`/api/admin/patterns/${id}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Not found");
        applyPatternForm(data.pattern as CrochetPattern);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!imageBusy) return;
    setImageElapsed(0);
    imageElapsedRef.current = 0;
    setImageHint(IMAGE_PROGRESS_HINTS[0]);
    const tick = window.setInterval(() => {
      imageElapsedRef.current += 1;
      setImageElapsed(imageElapsedRef.current);
    }, 1000);
    const hints = window.setInterval(() => {
      setImageHint(
        IMAGE_PROGRESS_HINTS[
          Math.floor(Date.now() / 8000) % IMAGE_PROGRESS_HINTS.length
        ]
      );
    }, 8000);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(hints);
    };
  }, [imageBusy]);

  const busy = saving || imageBusy;

  function toggleCategory(catId: string) {
    setCategoryIds((prev) =>
      prev.includes(catId)
        ? prev.filter((c) => c !== catId)
        : [...prev, catId]
    );
  }

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
      applyPatternForm(p);
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
      categoryIds,
      content: {
        ...pattern.content,
        title,
        summary,
        seoTitle,
        seoDescription,
      },
    });
    if (saved && featured && saved.status !== "published") {
      setMessage(
        "Saved — set status to published for Featured to appear on the homepage"
      );
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
    setImageBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/admin/patterns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerateImage" }),
      });
      let data: {
        pattern?: CrochetPattern;
        image?: { model?: string; size?: string };
        error?: string;
      } = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(
          res.ok
            ? "Invalid response from server"
            : `Image generation failed (${res.status}). The request may have timed out — try again.`
        );
      }
      if (!res.ok) {
        throw new Error(data.error || `Image generation failed (${res.status})`);
      }
      if (!data.pattern?.imagePath) {
        throw new Error("Server returned no image path");
      }
      setPattern(data.pattern);
      setImageVersion(Date.now());
      const secs = imageElapsedRef.current;
      const model = data.image?.model ? ` · ${data.image.model}` : "";
      setMessage(`Image regenerated successfully in ${secs}s${model}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Image generation failed — try again"
      );
      setMessage("");
    } finally {
      setImageBusy(false);
    }
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

  const previewSrc = withCacheBust(pattern.imagePath, imageVersion);
  const selectedCategoryNames = categories
    .filter((c) => categoryIds.includes(c.id))
    .map((c) => c.name.en)
    .join(", ");

  return (
    <AdminShell title={pattern.content.title.en}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/admin/patterns" className="text-sm text-slate-400">
          ← Library
        </Link>
        <button
          type="button"
          onClick={saveAll}
          disabled={busy}
          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {message && <span className="text-sm text-emerald-400">{message}</span>}
        {error && <span className="text-sm text-rose-400">{error}</span>}
      </div>

      {imageBusy && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-semibold">Regenerating image… {imageElapsed}s</p>
          <p className="mt-1 text-amber-100/80">{imageHint}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full animate-pulse rounded-full bg-amber-400"
              style={{
                width: `${Math.min(92, 12 + imageElapsed * 1.2)}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            {previewSrc ? (
              <Image
                key={previewSrc}
                src={previewSrc}
                alt=""
                fill
                unoptimized
                className="object-contain p-2"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-600">
                No image
              </div>
            )}
            {imageBusy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/75 px-4 text-center backdrop-blur-[2px]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                <p className="text-sm font-semibold text-amber-100">
                  Generating… {imageElapsed}s
                </p>
                <p className="text-xs text-slate-300">{imageHint}</p>
              </div>
            )}
          </div>
          <label className="block text-sm text-slate-400">
            Status
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={status}
              disabled={busy}
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
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <p className="text-sm font-medium text-slate-300">Categories</p>
            <p className="mt-1 text-xs text-slate-500">
              {selectedCategoryNames || "None selected"}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {categories.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={categoryIds.includes(c.id)}
                    disabled={busy}
                    onChange={() => toggleCategory(c.id)}
                  />
                  <span>
                    {c.icon} {c.name.en}
                  </span>
                </label>
              ))}
              {categories.length === 0 && (
                <p className="text-xs text-slate-500">
                  No categories yet. Create some under Categories.
                </p>
              )}
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={featured}
              disabled={busy}
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
              disabled={busy}
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
              disabled={busy}
              onChange={(e) => setPriceUsd(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </label>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={saveAll}
              className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-bold text-white hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={revalidate}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900 disabled:opacity-60"
            >
              Re-run stitch validation
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={autoFixStitches}
              className="rounded-lg border border-amber-700/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-100 hover:bg-amber-500/20 disabled:opacity-60"
            >
              Auto-fix stitch counts
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={retranslate}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900 disabled:opacity-60"
            >
              Re-translate FR/ES
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={regenImage}
              className="rounded-lg border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/20 disabled:opacity-60"
            >
              {imageBusy
                ? `Generating image… ${imageElapsed}s`
                : "Regenerate image"}
            </button>
            <button
              type="button"
              disabled={busy}
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-white">Copy & meta tags</h2>
              <div className="flex gap-1">
                {LOCALES.map((loc) => (
                  <button
                    key={loc.code}
                    type="button"
                    onClick={() => setLocaleTab(loc.code)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      localeTab === loc.code
                        ? "bg-rose-500 text-white"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Editing {LOCALES.find((l) => l.code === localeTab)?.label}. Meta
              title and description are used for search engines and social
              previews.
            </p>
            <label className="block text-sm text-slate-400">
              Title
              <input
                value={title[localeTab]}
                onChange={(e) =>
                  setTitle({ ...title, [localeTab]: e.target.value })
                }
                placeholder={`Title (${localeTab})`}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm text-slate-400">
              Summary
              <textarea
                value={summary[localeTab]}
                onChange={(e) =>
                  setSummary({ ...summary, [localeTab]: e.target.value })
                }
                rows={3}
                placeholder={`Summary (${localeTab})`}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm text-slate-400">
              Meta title
              <input
                value={seoTitle[localeTab]}
                onChange={(e) =>
                  setSeoTitle({ ...seoTitle, [localeTab]: e.target.value })
                }
                placeholder={`Meta title (${localeTab})`}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm text-slate-400">
              Meta description
              <textarea
                value={seoDescription[localeTab]}
                onChange={(e) =>
                  setSeoDescription({
                    ...seoDescription,
                    [localeTab]: e.target.value,
                  })
                }
                rows={2}
                placeholder={`Meta description (${localeTab})`}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
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
