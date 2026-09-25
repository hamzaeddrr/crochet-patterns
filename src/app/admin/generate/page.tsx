"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminGeneratePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState(
    "Cute 12 cm green frog amigurumi for beginners, with a small yellow crown and pink scarf"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState("");
  const [skipImage, setSkipImage] = useState(false);
  const [skipTranslate, setSkipTranslate] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    setLog("Generating design spec, pattern, image, PDF… this can take 1–2 minutes.");
    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          generateImage: !skipImage,
          translate: !skipTranslate,
          generatePdf: true,
          save: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
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
      <div className="max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">
          Admin only. Describe the crochet item — we generate a structured
          design, pattern JSON, product image, stitch validation, FR/ES titles,
          and a PDF draft.
        </p>
        <label className="mt-4 block text-sm font-medium text-slate-300">
          Prompt
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={skipImage}
              onChange={(e) => setSkipImage(e.target.checked)}
            />
            Skip image (faster / cheaper)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={skipTranslate}
              onChange={(e) => setSkipTranslate(e.target.checked)}
            />
            Skip FR/ES translation
          </label>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={loading || !prompt.trim()}
          className="mt-6 rounded-lg bg-rose-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-400 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate pattern"}
        </button>
        {log && <p className="mt-4 text-sm text-slate-300">{log}</p>}
        {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
      </div>
    </AdminShell>
  );
}
