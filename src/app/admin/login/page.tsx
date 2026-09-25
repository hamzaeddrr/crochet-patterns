"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Invalid password");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-rose-300">
          Loopcraft
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Admin login</h1>
        <p className="mt-2 text-sm text-slate-400">
          Studio access only — visitors cannot generate patterns.
        </p>
        <label className="mt-6 block text-sm text-slate-300">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            required
          />
        </label>
        {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-rose-500 py-2.5 text-sm font-bold text-white hover:bg-rose-400 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
