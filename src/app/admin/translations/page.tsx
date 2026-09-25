"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminTranslationsPage() {
  const [coverage, setCoverage] = useState<{
    patterns: number;
    missingFr: number;
    missingEs: number;
  } | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function load() {
    fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((d) => setCoverage(d.coverage));
  }

  useEffect(() => {
    load();
  }, []);

  async function translateMissing() {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "translateMissing" }),
    });
    const data = await res.json();
    setLoading(false);
    setMsg(res.ok ? `Updated ${data.updated} patterns` : data.error || "Failed");
    load();
  }

  return (
    <AdminShell title="Translations">
      <div className="max-w-lg space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">
          Coverage for pattern titles (FR/ES). Missing means empty or still
          equal to English.
        </p>
        {coverage ? (
          <ul className="space-y-2 text-sm text-slate-300">
            <li>Patterns: {coverage.patterns}</li>
            <li>Missing FR: {coverage.missingFr}</li>
            <li>Missing ES: {coverage.missingEs}</li>
          </ul>
        ) : (
          <p className="text-slate-500">Loading…</p>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={translateMissing}
          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? "Translating…" : "Translate missing (gpt-5-mini)"}
        </button>
        {msg && <p className="text-sm text-emerald-400">{msg}</p>}
      </div>
    </AdminShell>
  );
}
