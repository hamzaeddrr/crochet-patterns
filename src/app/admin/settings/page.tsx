"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

type SettingsPublic = {
  contentModel: string;
  imageModel: string;
  imageQuality: string;
  imageSize: string;
  siteUrl: string;
  defaultCurrency: string;
  defaultPriceCents: number;
  stripePublishableKey: string;
  hasOpenaiApiKey: boolean;
  hasStripeSecretKey: boolean;
  hasStripeWebhookSecret: boolean;
  hasAdminPasswordOverride: boolean;
};

export default function AdminSettingsPage() {
  const [s, setS] = useState<SettingsPublic | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setS(d.settings);
        setForm({
          contentModel: d.settings.contentModel,
          imageModel: d.settings.imageModel,
          imageQuality: d.settings.imageQuality,
          imageSize: d.settings.imageSize,
          siteUrl: d.settings.siteUrl,
          defaultCurrency: d.settings.defaultCurrency,
          defaultPriceCents: String(d.settings.defaultPriceCents),
          stripePublishableKey: d.settings.stripePublishableKey || "",
        });
      });
  }, []);

  async function save() {
    setMsg("");
    setErr("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        defaultPriceCents: Number(form.defaultPriceCents) || 499,
        openaiApiKey: form.openaiApiKey || undefined,
        stripeSecretKey: form.stripeSecretKey || undefined,
        stripeWebhookSecret: form.stripeWebhookSecret || undefined,
        adminPassword: form.adminPassword || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "Save failed");
      return;
    }
    setS(data.settings);
    setMsg("Settings saved");
    setForm((f) => ({
      ...f,
      openaiApiKey: "",
      stripeSecretKey: "",
      stripeWebhookSecret: "",
      adminPassword: "",
    }));
  }

  if (!s) {
    return (
      <AdminShell title="Settings">
        <p className="text-slate-400">Loading…</p>
      </AdminShell>
    );
  }

  const field = (key: string, label: string, type = "text", hint?: string) => (
    <label className="block text-sm text-slate-300">
      {label}
      {hint && <span className="ml-2 text-xs text-slate-500">{hint}</span>}
      <input
        type={type}
        value={form[key] || ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
        placeholder={type === "password" ? "Leave blank to keep current" : ""}
      />
    </label>
  );

  return (
    <AdminShell title="Settings">
      <div className="max-w-2xl space-y-6">
        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold text-white">OpenAI / AI</h2>
          <p className="text-xs text-slate-500">
            Key set: {s.hasOpenaiApiKey ? "yes" : "no (use env)"} · Defaults:
            gpt-5-mini + gpt-image-2.5-flare
          </p>
          {field("openaiApiKey", "OpenAI API key", "password")}
          {field("contentModel", "Content model")}
          {field("imageModel", "Image model")}
          {field("imageQuality", "Image quality", "text", "high / auto / …")}
          {field("imageSize", "Image size", "text", "auto for Flare")}
        </section>

        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold text-white">Site & pricing</h2>
          {field("siteUrl", "Public site URL")}
          {field("defaultCurrency", "Default currency", "text", "eur")}
          {field("defaultPriceCents", "Default price (cents)", "number")}
        </section>

        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold text-white">Stripe</h2>
          <p className="text-xs text-slate-500">
            Secret: {s.hasStripeSecretKey ? "yes" : "no"} · Webhook:{" "}
            {s.hasStripeWebhookSecret ? "yes" : "no"}
          </p>
          {field("stripePublishableKey", "Publishable key")}
          {field("stripeSecretKey", "Secret key", "password")}
          {field("stripeWebhookSecret", "Webhook secret", "password")}
        </section>

        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold text-white">Admin access</h2>
          {field("adminPassword", "New admin password", "password")}
        </section>

        <button
          type="button"
          onClick={save}
          className="rounded-lg bg-rose-500 px-5 py-2.5 text-sm font-bold text-white"
        >
          Save settings
        </button>
        {msg && <p className="text-sm text-emerald-400">{msg}</p>}
        {err && <p className="text-sm text-rose-400">{err}</p>}
      </div>
    </AdminShell>
  );
}
