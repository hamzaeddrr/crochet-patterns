import { AdminShell } from "@/components/admin/AdminShell";
import { readSiteContent } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const { categories } = await readSiteContent();
  return (
    <AdminShell title="Categories">
      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-slate-800 bg-slate-900 p-4"
          >
            <p className="text-2xl">{c.icon}</p>
            <p className="mt-2 font-semibold text-white">{c.name.en}</p>
            <p className="text-sm text-slate-400">{c.description.en}</p>
            <p className="mt-2 text-xs text-slate-500">/{c.slug}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-500">
        Default categories ship with the app. Editing UI can be expanded later.
      </p>
    </AdminShell>
  );
}
