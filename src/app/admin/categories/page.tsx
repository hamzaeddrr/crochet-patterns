"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import type { Locale } from "@/i18n/routing";

type Cat = {
  id: string;
  slug: string;
  name: { en: string; fr: string; es: string };
  description: { en: string; fr: string; es: string };
  icon: string;
};

const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
];

const empty = (): Omit<Cat, "id"> & { id?: string } => ({
  slug: "",
  name: { en: "", fr: "", es: "" },
  description: { en: "", fr: "", es: "" },
  icon: "🧶",
});

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Cat[]>([]);
  const [form, setForm] = useState(empty());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>("en");
  const [msg, setMsg] = useState("");

  const localeLabel = LOCALES.find((l) => l.code === locale)?.label || locale;

  async function load() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setMsg("");
    const payload = {
      id: editingId || undefined,
      nameEn: form.name.en,
      nameFr: form.name.fr,
      nameEs: form.name.es,
      descEn: form.description.en,
      descFr: form.description.fr,
      descEs: form.description.es,
      slug: form.slug,
      icon: form.icon,
    };
    const res = await fetch("/api/admin/categories", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload),
    });
    if (!res.ok) {
      const d = await res.json();
      setMsg(d.error || "Failed");
      return;
    }
    setForm(empty());
    setEditingId(null);
    setMsg("Saved");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete category?")) return;
    await fetch("/api/admin/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  function edit(c: Cat) {
    setEditingId(c.id);
    setForm(c);
    setLocale("en");
  }

  return (
    <AdminShell title="Categories">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-white">
                {editingId ? "Edit category" : "Add category"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {editingId
                  ? "Update icon, slug, and translations"
                  : "Create a new category for patterns"}
              </p>
            </div>
            <LocaleTabs locale={locale} onChange={setLocale} />
          </div>

          <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="text-sm font-medium text-slate-300">
              Basics
            </h3>
            <div className="grid gap-3 sm:grid-cols-[100px_1fr]">
              <label className="block text-sm text-slate-400">
                Icon
                <input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-center text-lg"
                />
              </label>
              <label className="block text-sm text-slate-400">
                Slug
                <input
                  placeholder="e.g. amigurumi"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </label>
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <div>
              <h3 className="text-sm font-medium text-slate-300">
                Name & description
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Editing in {localeLabel}
              </p>
            </div>
            <label className="block text-sm text-slate-400">
              Name
              <input
                placeholder={`Category name · ${localeLabel}`}
                value={form.name[locale]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: { ...form.name, [locale]: e.target.value },
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm text-slate-400">
              Description
              <textarea
                placeholder={`Short description · ${localeLabel}`}
                value={form.description[locale]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: {
                      ...form.description,
                      [locale]: e.target.value,
                    },
                  })
                }
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
          </section>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white hover:bg-rose-400"
            >
              {editingId ? "Save changes" : "Add category"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(empty());
                }}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-950"
              >
                Cancel
              </button>
            )}
          </div>
          {msg && <p className="text-sm text-emerald-400">{msg}</p>}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-slate-400">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"}
          </h2>
          {categories.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{c.icon}</span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {c.name.en || c.slug}
                      </p>
                      <p className="text-xs text-slate-500">/{c.slug}</p>
                    </div>
                  </div>
                  {c.description.en && (
                    <p className="mt-2 text-sm text-slate-400">
                      {c.description.en}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {LOCALES.map((loc) => {
                      const hasName = Boolean(c.name[loc.code]?.trim());
                      return (
                        <span
                          key={loc.code}
                          className={`rounded-md px-2 py-0.5 ${
                            hasName
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-slate-800 text-slate-500"
                          }`}
                        >
                          {loc.label}
                          {hasName ? "" : " —"}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => edit(c)}
                    className="rounded-md bg-slate-800 px-2.5 py-1 text-rose-300 hover:bg-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    className="rounded-md px-2.5 py-1 text-slate-500 hover:text-rose-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-800 px-4 py-10 text-center text-sm text-slate-500">
              No categories yet. Add one on the left.
            </p>
          )}
        </div>
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
