"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";

type Category = {
  id: string;
  slug: string;
  name: { en: string };
};

export default function AdminGeneratePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [creative, setCreative] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState("");
  const [step, setStep] = useState("");
  const [skipImage, setSkipImage] = useState(false);
  const [skipTranslate, setSkipTranslate] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [free, setFree] = useState(false);
  const [priceCents, setPriceCents] = useState("499");
  const [allowNewCategory, setAllowNewCategory] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.defaultPriceCents) {
          setPriceCents(String(d.settings.defaultPriceCents));
        }
      })
      .catch(() => {});
  }, []);

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function generate() {
    if (!creative && !prompt.trim()) {
      setError("Enter a subject or enable creative mode");
      return;
    }
    setLoading(true);
    setError("");
    setStep("1/4 Design spec");
    setLog(
      "Running professional one-shot: design → pattern → image → translate → PDF…"
    );
    try {
      setStep("2/4 Pattern + image");
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          creative: creative || !prompt.trim(),
          categoryIds,
          allowNewCategory,
          featured,
          free,
          priceCents: free ? 0 : Number(priceCents) || 499,
          translate: !skipTranslate,
          generateImage: !skipImage,
          generatePdf: true,
          save: true,
        }),
      });
      setStep("3/4 Saving draft");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setStep("4/4 Done");
      setLog(
        `Saved draft: ${data.pattern.content.title.en} (validation ${
          data.pattern.validation.ok ? "OK" : "has issues"
        })`
      );
      router.push(`/admin/patterns/${data.pattern.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell title="AI Generate">
      <div className="max-w-2xl space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">
          One-shot professional generate: design spec, full pattern, product
          image (gpt-image-2.5-flare), stitch check, FR/ES, PDF — all in one run.
        </p>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={creative}
            onChange={(e) => setCreative(e.target.checked)}
          />
          Creative mode (AI invents subject when prompt empty)
        </label>

        <label className="block text-sm font-medium text-slate-300">
          Subject / prompt{" "}
          <span className="font-normal text-slate-500">(optional)</span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="e.g. 12 cm green frog amigurumi with tiny crown — or leave blank for creative"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={free}
              onChange={(e) => setFree(e.target.checked)}
            />
            Free pattern
          </label>
          {!free && (
            <label className="block text-sm text-slate-300 sm:col-span-2">
              Price (cents)
              <input
                type="number"
                value={priceCents}
                onChange={(e) => setPriceCents(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-300">Categories</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  categoryIds.includes(c.id)
                    ? "bg-rose-500 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {c.name.en}
              </button>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={allowNewCategory}
              onChange={(e) => setAllowNewCategory(e.target.checked)}
            />
            Allow AI to create a new category
          </label>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={skipImage}
              onChange={(e) => setSkipImage(e.target.checked)}
            />
            Skip image
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={skipTranslate}
              onChange={(e) => setSkipTranslate(e.target.checked)}
            />
            Skip FR/ES
          </label>
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="rounded-lg bg-rose-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-400 disabled:opacity-50"
        >
          {loading ? `Generating… ${step}` : "Generate pattern"}
        </button>
        {log && <p className="text-sm text-slate-300">{log}</p>}
        {error && <p className="text-sm text-rose-400">{error}</p>}
      </div>
    </AdminShell>
  );
}
