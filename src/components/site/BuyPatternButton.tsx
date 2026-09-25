"use client";

import { useState } from "react";
import { formatPrice } from "@/types";

export function BuyPatternButton({
  slug,
  locale,
  priceCents,
  currency,
  label,
  className,
}: {
  slug: string;
  locale: string;
  priceCents: number;
  currency: string;
  label: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buy() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No checkout URL");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={buy}
        disabled={loading}
        className="btn-primary disabled:opacity-60"
      >
        {loading
          ? "…"
          : `${label} · ${formatPrice(priceCents, currency)}`}
      </button>
      {error && <p className="mt-2 text-sm text-apricot">{error}</p>}
    </div>
  );
}
