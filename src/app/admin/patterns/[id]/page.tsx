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
import {
  detectConstructionMode,
  isAccessoryOrNoteRound,
  isFastenOffRound,
  isRedundantNoteComponent,
  partitionComponentRounds,
  stepLabelForMode,
} from "@/lib/crochet/construction";

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

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "copy", label: "Copy & SEO" },
  { id: "pattern", label: "Pattern" },
  { id: "tools", label: "Tools" },
] as const;

type TabId = (typeof TABS)[number]["id"];

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
  const [tab, setTab] = useState<TabId>("overview");
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
  const [showDesignSpec, setShowDesignSpec] = useState(false);
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

  function reloadCategories() {
    return fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => setCategories([]));
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
    reloadCategories();
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
  const localeLabel =
    LOCALES.find((l) => l.code === localeTab)?.label || localeTab;

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

  async function recoverCategory() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/admin/patterns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recoverCategory" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not recover category");
        return;
      }
      applyPatternForm(data.pattern as CrochetPattern);
      await reloadCategories();
      setMessage(
        data.created
          ? `Category saved: ${data.category?.name?.en || data.category?.id}`
          : `Category linked: ${data.category?.name?.en || data.category?.id}`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not recover category");
    } finally {
      setSaving(false);
    }
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
  const assignedCategories = categories.filter((c) =>
    categoryIds.includes(c.id)
  );
  const orphanCategoryIds = categoryIds.filter(
    (cid) => !categories.some((c) => c.id === cid)
  );
  const needsCategoryRecover =
    assignedCategories.length === 0 || orphanCategoryIds.length > 0;

  return (
    <AdminShell title={pattern.content.title.en}>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="min-w-0">
          <Link
            href="/admin/patterns"
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            ← Library
          </Link>
          <h1 className="mt-1 truncate text-xl font-semibold text-white">
            {title.en || pattern.content.title.en}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-mono">/{pattern.slug}</span>
            <span
              className={`rounded-md px-2 py-0.5 capitalize ${
                status === "published"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {status}
            </span>
            {assignedCategories.map((c) => (
              <span
                key={c.id}
                className="rounded-md bg-slate-800 px-2 py-0.5 text-slate-300"
              >
                {c.icon} {c.name.en}
              </span>
            ))}
            {needsCategoryRecover && (
              <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-amber-300">
                Category missing
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status === "published" && (
            <a
              href={`/patterns/${pattern.slug}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-rose-300 hover:bg-slate-900"
            >
              View on site
            </a>
          )}
          <button
            type="button"
            onClick={saveAll}
            disabled={busy}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {(message || error) && (
        <div className="mb-4 flex flex-wrap gap-3 text-sm">
          {message && <span className="text-emerald-400">{message}</span>}
          {error && <span className="text-rose-400">{error}</span>}
        </div>
      )}

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

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-1 rounded-xl bg-slate-900 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === t.id
                ? "bg-rose-500 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
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
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:col-span-2">
              <h2 className="text-sm font-semibold text-white">Publishing</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-slate-400">
                  Status
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    value={status}
                    disabled={busy}
                    onChange={(e) =>
                      setStatus(e.target.value as PatternStatus)
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
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={featured}
                    disabled={busy}
                    onChange={(e) => setFeatured(e.target.checked)}
                  />
                  Featured on homepage
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={free}
                    disabled={busy}
                    onChange={(e) => setFree(e.target.checked)}
                  />
                  Free download
                </label>
              </div>
              <p className="text-xs text-slate-500">
                Featured only appears on the site when status is published.
              </p>
            </section>

            <section
              className={`rounded-xl border p-4 sm:col-span-2 ${
                needsCategoryRecover
                  ? "border-amber-500/40 bg-amber-500/5"
                  : "border-slate-800 bg-slate-900"
              }`}
            >
              <h2 className="text-sm font-semibold text-white">Category</h2>
              {assignedCategories.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-white">
                  {assignedCategories.map((c) => (
                    <li key={c.id}>
                      {c.icon} {c.name.en}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-amber-300">
                  {orphanCategoryIds.length
                    ? `Missing category (${orphanCategoryIds.join(", ")})`
                    : "No category assigned"}
                </p>
              )}
              {needsCategoryRecover && (
                <div className="mt-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={recoverCategory}
                    className="rounded-lg border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/20 disabled:opacity-60"
                  >
                    Recover category from design spec
                  </button>
                  <p className="mt-2 text-xs text-slate-500">
                    Saves immediately — no need to click Save changes for the
                    category.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:col-span-2">
              <h2 className="text-sm font-semibold text-white">Quick facts</h2>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Object</dt>
                  <dd className="text-slate-200">{pattern.designSpec.object}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Difficulty</dt>
                  <dd className="capitalize text-slate-200">
                    {pattern.designSpec.difficulty}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Construction</dt>
                  <dd className="text-slate-200">
                    {pattern.designSpec.construction}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Confidence</dt>
                  <dd className="capitalize text-slate-200">
                    {pattern.confidence}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Validation</dt>
                  <dd
                    className={
                      pattern.validation.ok
                        ? "text-emerald-400"
                        : "text-amber-300"
                    }
                  >
                    {pattern.validation.ok
                      ? "OK"
                      : `${pattern.validation.issues.length} issues`}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Suggested category</dt>
                  <dd className="text-slate-200">
                    {pattern.designSpec.suggested_category_name ||
                      pattern.designSpec.suggested_category_slug ||
                      "—"}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      )}

      {/* Copy & SEO */}
      {tab === "copy" && (
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-400">
              Editing in <span className="text-slate-200">{localeLabel}</span>
            </p>
            <div className="flex gap-1 rounded-lg bg-slate-900 p-1">
              {LOCALES.map((loc) => (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => setLocaleTab(loc.code)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                    localeTab === loc.code
                      ? "bg-rose-500 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>

          <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold text-white">Page copy</h2>
            <p className="text-xs text-slate-500">
              Title and summary shown on the pattern page ({localeLabel})
            </p>
            <label className="block text-sm text-slate-400">
              Title
              <input
                value={title[localeTab]}
                onChange={(e) =>
                  setTitle({ ...title, [localeTab]: e.target.value })
                }
                placeholder={`Title · ${localeLabel}`}
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
                rows={4}
                placeholder={`Summary · ${localeLabel}`}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
          </section>

          <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold text-white">Meta tags</h2>
            <p className="text-xs text-slate-500">
              Search engines and social previews ({localeLabel})
            </p>
            <label className="block text-sm text-slate-400">
              Meta title
              <input
                value={seoTitle[localeTab]}
                onChange={(e) =>
                  setSeoTitle({ ...seoTitle, [localeTab]: e.target.value })
                }
                placeholder={`Meta title · ${localeLabel}`}
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
                rows={3}
                placeholder={`Meta description · ${localeLabel}`}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
          </section>

          <button
            type="button"
            disabled={busy}
            onClick={retranslate}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-900 disabled:opacity-60"
          >
            Re-translate FR/ES from English
          </button>
        </div>
      )}

      {/* Pattern preview */}
      {tab === "pattern" && (
        <div className="space-y-4">
          {pattern.content.components.map((c) => {
            if (isRedundantNoteComponent(c)) {
              return (
                <section
                  key={c.id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                  <h2 className="font-semibold text-slate-400">
                    {c.name}{" "}
                    <span className="text-xs font-normal">(folded into Assembly)</span>
                  </h2>
                </section>
              );
            }
            const mode = detectConstructionMode(c);
            const step = stepLabelForMode(mode);
            const { main, accessories } = partitionComponentRounds(
              c.rounds || []
            );
            return (
              <section
                key={c.id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-5"
              >
                <h2 className="font-semibold text-rose-200">
                  {c.name}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    · {mode === "note" ? "note" : step}
                  </span>
                </h2>
                {mode === "note" ? (
                  <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
                    {(c.rounds || []).map((r, i) => (
                      <li key={i}>{r.instructions}</li>
                    ))}
                  </ul>
                ) : (
                  <>
                    <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
                      {main.map((r, i) => {
                        const fo = isFastenOffRound(r);
                        return (
                          <li key={`m-${i}`} className="flex gap-2">
                            <span className="w-14 shrink-0 font-mono text-slate-500">
                              {fo ? "FO" : `${step} ${r.round}`}
                            </span>
                            <span>
                              {r.instructions}
                              {!fo &&
                              typeof r.result === "number" &&
                              r.result > 0 ? (
                                <span className="text-slate-500">
                                  {" "}
                                  ({r.result})
                                </span>
                              ) : null}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    {accessories
                      .filter(
                        (acc) =>
                          !acc.steps.every((s) =>
                            isAccessoryOrNoteRound(s) &&
                            /\bassembl\w*|sew together|closing\b/i.test(
                              s.instructions || ""
                            )
                          )
                      )
                      .map((acc) => (
                        <div key={acc.title} className="mt-4">
                          <h3 className="text-sm font-semibold text-amber-200">
                            {acc.title}
                          </h3>
                          <ul className="mt-1 space-y-1 text-sm text-slate-400">
                            {acc.steps.map((s, i) => (
                              <li key={i}>• {s.instructions}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Tools */}
      {tab === "tools" && (
        <div className="grid max-w-3xl gap-4">
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-white">
                Validation{" "}
                {pattern.validation.ok ? (
                  <span className="text-emerald-400">✓</span>
                ) : (
                  <span className="text-amber-400">⚠</span>
                )}
              </h2>
              <p className="text-xs capitalize text-slate-500">
                Confidence: {pattern.confidence}
              </p>
            </div>
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
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={revalidate}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-950 disabled:opacity-60"
              >
                Re-run validation
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={autoFixStitches}
                className="rounded-lg border border-amber-700/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-100 hover:bg-amber-500/20 disabled:opacity-60"
              >
                Auto-fix stitch counts
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold text-white">Assets</h2>
            <div className="mt-3 flex flex-wrap gap-2">
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
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-950 disabled:opacity-60"
              >
                Rebuild PDF
              </button>
              {pattern.pdfPath && (
                <a
                  href={pattern.pdfPath}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-bold text-white"
                >
                  Open PDF
                </a>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <button
              type="button"
              onClick={() => setShowDesignSpec((v) => !v)}
              className="flex w-full items-center justify-between text-left"
            >
              <h2 className="font-semibold text-white">Design spec</h2>
              <span className="text-xs text-slate-500">
                {showDesignSpec ? "Hide" : "Show"}
              </span>
            </button>
            {showDesignSpec && (
              <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-300">
                {JSON.stringify(pattern.designSpec, null, 2)}
              </pre>
            )}
          </section>

          <button
            type="button"
            onClick={remove}
            className="justify-self-start text-sm text-rose-400 hover:text-rose-300"
          >
            Delete pattern
          </button>
        </div>
      )}
    </AdminShell>
  );
}
