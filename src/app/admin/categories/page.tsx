"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

type Cat = {
  id: string;
  slug: string;
  name: { en: string; fr: string; es: string };
  description: { en: string; fr: string; es: string };
  icon: string;
};

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
  const [msg, setMsg] = useState("");

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
  }

  return (
    <AdminShell title="Categories">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="font-semibold text-white">
            {editingId ? "Edit category" : "Add category"}
          </h2>
          <input
            placeholder="Icon"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          />
          <input
            placeholder="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          />
          {(["en", "fr", "es"] as const).map((loc) => (
            <div key={loc} className="space-y-2">
              <p className="text-xs uppercase text-slate-500">{loc}</p>
              <input
                placeholder={`Name (${loc})`}
                value={form.name[loc]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: { ...form.name, [loc]: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <textarea
                placeholder={`Description (${loc})`}
                value={form.description[loc]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: {
                      ...form.description,
                      [loc]: e.target.value,
                    },
                  })
                }
                rows={2}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white"
            >
              Save
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(empty());
                }}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
          {msg && <p className="text-sm text-emerald-400">{msg}</p>}
        </div>

        <div className="space-y-3">
          {categories.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-2xl">{c.icon}</p>
                  <p className="mt-1 font-semibold text-white">{c.name.en}</p>
                  <p className="text-sm text-slate-400">{c.description.en}</p>
                  <p className="mt-1 text-xs text-slate-500">/{c.slug}</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => edit(c)}
                    className="text-rose-300"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    className="text-slate-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
