"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { formatPrice, type PurchaseRecord } from "@/types";

export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);

  useEffect(() => {
    fetch("/api/admin/purchases")
      .then((r) => r.json())
      .then((d) => setPurchases(d.purchases || []));
  }, []);

  return (
    <AdminShell title="Purchases">
      {purchases.length === 0 ? (
        <p className="text-slate-400">No purchases yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Pattern</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Session</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(p.unlockedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-white">{p.patternSlug}</td>
                  <td className="px-4 py-3 text-slate-300">{p.email || "—"}</td>
                  <td className="px-4 py-3">
                    {formatPrice(p.amountCents, p.currency)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {p.sessionId.slice(0, 16)}…
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
