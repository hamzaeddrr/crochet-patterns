import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { readSiteContent } from "@/lib/data/store";
import { listAiUsage } from "@/lib/ai/usage-log";
import { formatUsd, sumCosts } from "@/lib/ai/pricing";
import { CircleDollarSign, FolderOpen, Library, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { categories, patterns } = await readSiteContent();
  const published = patterns.filter((p) => p.status === "published").length;
  const drafts = patterns.filter((p) => p.status === "draft").length;
  const usage = await listAiUsage(200);
  const usageTotal = sumCosts(usage.map((e) => e.cost));

  return (
    <AdminShell title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Patterns",
            value: String(patterns.length),
            href: "/admin/patterns",
          },
          {
            label: "Published",
            value: String(published),
            href: "/admin/patterns",
          },
          { label: "Drafts", value: String(drafts), href: "/admin/patterns" },
          {
            label: "AI spend (logged)",
            value: formatUsd(usageTotal.usd),
            href: "/admin/usage",
          },
        ].map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-slate-800 bg-slate-900 p-5"
          >
            <p className="text-3xl font-bold text-white">{c.value}</p>
            <p className="text-sm text-slate-400">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-4">
        <Link
          href="/admin/generate"
          className="rounded-xl border border-slate-800 bg-slate-900 p-6 hover:border-rose-500/40"
        >
          <Sparkles className="h-5 w-5 text-rose-300" />
          <h2 className="mt-3 font-semibold text-white">AI Generate</h2>
          <p className="mt-1 text-sm text-slate-400">
            Create design spec, image, pattern, validation, and PDF.
          </p>
        </Link>
        <Link
          href="/admin/usage"
          className="rounded-xl border border-slate-800 bg-slate-900 p-6 hover:border-rose-500/40"
        >
          <CircleDollarSign className="h-5 w-5 text-rose-300" />
          <h2 className="mt-3 font-semibold text-white">AI usage & costs</h2>
          <p className="mt-1 text-sm text-slate-400">
            Token costs per generation — compare with OpenAI billing.
          </p>
        </Link>
        <Link
          href="/admin/patterns"
          className="rounded-xl border border-slate-800 bg-slate-900 p-6 hover:border-rose-500/40"
        >
          <Library className="h-5 w-5 text-rose-300" />
          <h2 className="mt-3 font-semibold text-white">Pattern library</h2>
          <p className="mt-1 text-sm text-slate-400">
            Review, edit status, publish to the public site.
          </p>
        </Link>
        <Link
          href="/admin/categories"
          className="rounded-xl border border-slate-800 bg-slate-900 p-6 hover:border-rose-500/40"
        >
          <FolderOpen className="h-5 w-5 text-rose-300" />
          <h2 className="mt-3 font-semibold text-white">
            Categories ({categories.length})
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Organize amigurumi, accessories, home, seasonal.
          </p>
        </Link>
      </div>
    </AdminShell>
  );
}
