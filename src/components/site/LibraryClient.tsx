"use client";

import { useEffect, useMemo, useState } from "react";
import { PatternCard } from "@/components/site/PatternCard";
import {
  getFavoriteIds,
  getRecentEntries,
} from "@/lib/client/pattern-library";
import type { CrochetPattern } from "@/types";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

type Tab = "saved" | "recent";

export function LibraryClient({
  patterns,
  locale,
  labels,
}: {
  patterns: CrochetPattern[];
  locale: Locale;
  labels: {
    title: string;
    subtitle: string;
    saved: string;
    recent: string;
    emptySaved: string;
    emptyRecent: string;
    browse: string;
  };
}) {
  const [tab, setTab] = useState<Tab>("saved");
  const [favIds, setFavIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => {
      setFavIds(getFavoriteIds());
      setRecentIds(getRecentEntries().map((e) => e.id));
    };
    sync();
    window.addEventListener("loopcraft:library", sync);
    return () => window.removeEventListener("loopcraft:library", sync);
  }, []);

  const byId = useMemo(() => {
    const map = new Map(patterns.map((p) => [p.id, p]));
    return map;
  }, [patterns]);

  const list =
    tab === "saved"
      ? favIds.map((id) => byId.get(id)).filter(Boolean)
      : recentIds.map((id) => byId.get(id)).filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-32 sm:px-6">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">
        {labels.title}
      </h1>
      <p className="mt-3 max-w-2xl text-muted">{labels.subtitle}</p>

      <div className="mt-8 flex gap-2">
        {(
          [
            ["saved", labels.saved],
            ["recent", labels.recent],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${
              tab === id
                ? "bg-apricot text-bone"
                : "bg-elevated text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="soft-card mt-10 p-10 text-center">
          <p className="text-muted">
            {tab === "saved" ? labels.emptySaved : labels.emptyRecent}
          </p>
          <Link href="/patterns" className="btn-primary mt-6 inline-flex">
            {labels.browse}
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) =>
            p ? (
              <PatternCard
                key={p.id}
                pattern={p}
                locale={locale}
                index={i}
              />
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
