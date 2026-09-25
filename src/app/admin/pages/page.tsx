"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

const PAGE_KEYS = [
  "home",
  "patterns",
  "categories",
  "about",
  "contact",
  "blog",
  "privacy",
  "terms",
] as const;

type Loc = { en: string; fr: string; es: string };

export default function AdminPagesSeoPage() {
  const [pages, setPages] = useState<Record<string, Record<string, Loc | string>>>({});
  const [key, setKey] = useState<(typeof PAGE_KEYS)[number]>("home");
  const [msg, setMsg] = useState("");
  const [tagline, setTagline] = useState<Loc>({ en: "", fr: "", es: "" });
  const [siteName, setSiteName] = useState("Loopcraft");

  useEffect(() => {
    fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((d) => {
        setPages(d.pages || {});
        if (d.settings?.tagline) setTagline(d.settings.tagline);
        if (d.settings?.siteName) setSiteName(d.settings.siteName);
      });
  }, []);

  const page = pages[key] || {};

  function setField(field: string, loc: keyof Loc, value: string) {
    const current = (page[field] as Loc) || { en: "", fr: "", es: "" };
    setPages({
      ...pages,
      [key]: {
        ...page,
        [field]: { ...current, [loc]: value },
      },
    });
  }

  async function savePage() {
    setMsg("");
    const res = await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updatePage", key, page: pages[key] }),
    });
    setMsg(res.ok ? "Page saved" : "Save failed");
  }

  async function saveSite() {
    setMsg("");
    const res = await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateTagline",
        tagline,
        siteName,
      }),
    });
    setMsg(res.ok ? "Site settings saved" : "Save failed");
  }

  const locField = (field: string, label: string) => (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-300">{label}</p>
      {(["en", "fr", "es"] as const).map((loc) => (
        <textarea
          key={loc}
          rows={field.includes("body") || field.includes("Subtitle") ? 3 : 2}
          placeholder={`${label} (${loc})`}
          value={((page[field] as Loc) || { en: "", fr: "", es: "" })[loc]}
          onChange={(e) => setField(field, loc, e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        />
      ))}
    </div>
  );

  return (
    <AdminShell title="Pages & SEO">
      <div className="mb-6 space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="font-semibold text-white">Site name & tagline</h2>
        <input
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
        {(["en", "fr", "es"] as const).map((loc) => (
          <input
            key={loc}
            value={tagline[loc]}
            onChange={(e) => setTagline({ ...tagline, [loc]: e.target.value })}
            placeholder={`Tagline (${loc})`}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          />
        ))}
        <button
          type="button"
          onClick={saveSite}
          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white"
        >
          Save site
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {PAGE_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKey(k)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              key === k ? "bg-rose-500 text-white" : "bg-slate-800 text-slate-400"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="max-w-2xl space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
        {locField("seoTitle", "SEO title")}
        {locField("seoDescription", "SEO description")}
        {(key === "home" || key === "about" || key === "contact") &&
          locField("heroTitle", "Hero / title")}
        {key === "home" && locField("heroSubtitle", "Hero subtitle")}
        {["about", "contact", "privacy", "terms"].includes(key) &&
          locField("body", "Body")}
        <button
          type="button"
          onClick={savePage}
          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white"
        >
          Save {key}
        </button>
        {msg && <p className="text-sm text-emerald-400">{msg}</p>}
      </div>
    </AdminShell>
  );
}
