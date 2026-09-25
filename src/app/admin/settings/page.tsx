import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminSettingsPage() {
  return (
    <AdminShell title="Settings">
      <div className="max-w-xl space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
        <p>
          Configure secrets in <code className="text-rose-200">.env.local</code>:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-slate-400">
          <li>ADMIN_PASSWORD — admin login</li>
          <li>ADMIN_SECRET — session signing</li>
          <li>OPENAI_API_KEY — pattern + image generation</li>
          <li>OPENAI_CONTENT_MODEL — default gpt-4o-mini</li>
          <li>OPENAI_IMAGE_MODEL — default gpt-image-1-mini</li>
          <li>NEXT_PUBLIC_SITE_URL — SEO canonical URLs</li>
        </ul>
        <p className="text-slate-500">
          English is the source language. French and Spanish titles/summaries are
          filled during AI generate (unless skipped).
        </p>
      </div>
    </AdminShell>
  );
}
