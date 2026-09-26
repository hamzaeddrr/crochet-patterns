"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import type { Locale } from "@/i18n/routing";

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

const PAGE_LABELS: Record<(typeof PAGE_KEYS)[number], string> = {
  home: "Home",
  patterns: "Patterns",
  categories: "Categories",
  about: "About",
  contact: "Contact",
  blog: "Blog",
  privacy: "Privacy",
  terms: "Terms",
};

const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
];

type Loc = { en: string; fr: string; es: string };

function emptyLoc(): Loc {
  return { en: "", fr: "", es: "" };
}

export default function AdminPagesSeoPage() {
  const [pages, setPages] = useState<
    Record<string, Record<string, Loc | string>>
  >({});
  const [key, setKey] = useState<(typeof PAGE_KEYS)[number]>("home");
  const [locale, setLocale] = useState<Locale>("en");
  const [msg, setMsg] = useState("");
  const [tagline, setTagline] = useState<Loc>(emptyLoc());
  const [siteName, setSiteName] = useState("Loopcraft");
  const [uploading, setUploading] = useState(false);

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
  const localeLabel = LOCALES.find((l) => l.code === locale)?.label || locale;

  function getLoc(field: string): Loc {
    return (page[field] as Loc) || emptyLoc();
  }

  function setField(field: string, value: string) {
    const current = getLoc(field);
    setPages({
      ...pages,
      [key]: {
        ...page,
        [field]: { ...current, [locale]: value },
      },
    });
  }

  function setHeroImage(path: string) {
    setPages({
      ...pages,
      [key]: {
        ...page,
        heroImage: path,
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
    setMsg(res.ok ? `${PAGE_LABELS[key]} page saved` : "Save failed");
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

  async function uploadHero(file: File) {
    setUploading(true);
    setMsg("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setMsg(data.error || "Upload failed");
      return;
    }
    setHeroImage(data.path);
    setMsg(`Image uploaded — click Save ${PAGE_LABELS[key]}`);
  }

  const heroImage =
    typeof page.heroImage === "string" ? page.heroImage : "";

  const showHeroTitle =
    key === "home" || key === "about" || key === "contact";
  const showBody = ["about", "contact", "privacy", "terms"].includes(key);

  return (
    <AdminShell title="Pages & SEO">
      {msg && (
        <p className="mb-4 text-sm text-emerald-400">{msg}</p>
      )}

      {/* Site settings */}
      <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-white">Site settings</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Brand name and homepage tagline
            </p>
          </div>
          <LocaleTabs locale={locale} onChange={setLocale} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-slate-400 sm:col-span-2">
            Site name
            <input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </label>
          <label className="block text-sm text-slate-400 sm:col-span-2">
            Tagline ({localeLabel})
            <input
              value={tagline[locale]}
              onChange={(e) =>
                setTagline({ ...tagline, [locale]: e.target.value })
              }
              placeholder={`Tagline in ${localeLabel}`}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={saveSite}
          className="mt-4 rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white hover:bg-rose-400"
        >
          Save site settings
        </button>
      </section>

      {/* Page picker */}
      <div className="mb-4 flex flex-wrap gap-2">
        {PAGE_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKey(k)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize ${
              key === k
                ? "bg-rose-500 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {PAGE_LABELS[k]}
          </button>
        ))}
      </div>

      <div className="max-w-3xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {PAGE_LABELS[key]}
            </h2>
            <p className="text-xs text-slate-500">
              Editing content in {localeLabel}
            </p>
          </div>
          <LocaleTabs locale={locale} onChange={setLocale} />
        </div>

        {/* Meta tags */}
        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div>
            <h3 className="font-semibold text-white">Meta tags</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Search engines and social previews ({localeLabel})
            </p>
          </div>
          <label className="block text-sm text-slate-400">
            Meta title
            <input
              value={getLoc("seoTitle")[locale]}
              onChange={(e) => setField("seoTitle", e.target.value)}
              placeholder={`Meta title · ${localeLabel}`}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block text-sm text-slate-400">
            Meta description
            <textarea
              rows={2}
              value={getLoc("seoDescription")[locale]}
              onChange={(e) => setField("seoDescription", e.target.value)}
              placeholder={`Meta description · ${localeLabel}`}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </label>
        </section>

        {/* Page content */}
        {(showHeroTitle || key === "home" || showBody) && (
          <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div>
              <h3 className="font-semibold text-white">Page content</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Visible copy on the page ({localeLabel})
              </p>
            </div>

            {showHeroTitle && (
              <label className="block text-sm text-slate-400">
                Hero title
                <textarea
                  rows={2}
                  value={getLoc("heroTitle")[locale]}
                  onChange={(e) => setField("heroTitle", e.target.value)}
                  placeholder={`Hero title · ${localeLabel}`}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </label>
            )}

            {key === "home" && (
              <label className="block text-sm text-slate-400">
                Hero subtitle
                <textarea
                  rows={3}
                  value={getLoc("heroSubtitle")[locale]}
                  onChange={(e) => setField("heroSubtitle", e.target.value)}
                  placeholder={`Hero subtitle · ${localeLabel}`}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </label>
            )}

            {showBody && (
              <label className="block text-sm text-slate-400">
                Body
                <textarea
                  rows={6}
                  value={getLoc("body")[locale]}
                  onChange={(e) => setField("body", e.target.value)}
                  placeholder={`Body · ${localeLabel}`}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </label>
            )}
          </section>
        )}

        {/* Home hero image card */}
        {key === "home" && (
          <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div>
              <h3 className="font-semibold text-white">Hero image card</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Right-side photo and overlay text on the homepage
              </p>
            </div>

            {heroImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroImage}
                alt="Hero preview"
                className="h-40 w-32 rounded-xl object-cover"
              />
            )}
            <label className="block text-sm text-slate-400">
              Image path
              <input
                type="text"
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
                placeholder="/site/my-hero.webp"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-950">
              {uploading ? "Uploading…" : "Upload image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadHero(f);
                }}
              />
            </label>

            <div className="border-t border-slate-800 pt-3">
              <p className="mb-3 text-xs text-slate-500">
                Card overlay text · {localeLabel}
              </p>
              <div className="space-y-3">
                <label className="block text-sm text-slate-400">
                  Card eyebrow
                  <input
                    value={getLoc("heroCardEyebrow")[locale]}
                    onChange={(e) =>
                      setField("heroCardEyebrow", e.target.value)
                    }
                    placeholder={`Eyebrow · ${localeLabel}`}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="block text-sm text-slate-400">
                  Card title
                  <input
                    value={getLoc("heroCardTitle")[locale]}
                    onChange={(e) => setField("heroCardTitle", e.target.value)}
                    placeholder={`Card title · ${localeLabel}`}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="block text-sm text-slate-400">
                  Card body
                  <textarea
                    rows={3}
                    value={getLoc("heroCardBody")[locale]}
                    onChange={(e) => setField("heroCardBody", e.target.value)}
                    placeholder={`Card body · ${localeLabel}`}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </label>
              </div>
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={savePage}
          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white hover:bg-rose-400"
        >
          Save {PAGE_LABELS[key]}
        </button>
      </div>
    </AdminShell>
  );
}

function LocaleTabs({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (loc: Locale) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-slate-950 p-1">
      {LOCALES.map((loc) => (
        <button
          key={loc.code}
          type="button"
          onClick={() => onChange(loc.code)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
            locale === loc.code
              ? "bg-rose-500 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {loc.label}
        </button>
      ))}
    </div>
  );
}
