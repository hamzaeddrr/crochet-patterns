import Link from "next/link";
import Image from "next/image";
import { AdminShell } from "@/components/admin/AdminShell";
import { readSiteContent } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export default async function AdminPatternsPage() {
  const { patterns } = await readSiteContent();

  return (
    <AdminShell title="Pattern library">
      <div className="mb-4 flex justify-end">
        <Link
          href="/admin/generate"
          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white"
        >
          + Generate new
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-4 py-3">Pattern</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Validation</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {patterns.map((p) => (
              <tr key={p.id} className="border-t border-slate-800">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-slate-800">
                      {p.thumbnailPath && (
                        <Image
                          src={p.thumbnailPath}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {p.content.title.en}
                      </p>
                      <p className="text-xs text-slate-500">{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 capitalize text-slate-300">
                  {p.status}
                </td>
                <td className="px-4 py-3">
                  {p.validation.ok ? (
                    <span className="text-emerald-400">OK</span>
                  ) : (
                    <span className="text-amber-400">
                      {p.validation.issues.length} issues
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 capitalize text-slate-300">
                  {p.confidence}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/patterns/${p.id}`}
                    className="text-rose-300 hover:text-rose-200"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {patterns.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  No patterns yet. Generate one from AI Generate.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
