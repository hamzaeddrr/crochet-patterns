"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { formatUsd } from "@/lib/ai/pricing";

type Cost = {
  textInputTokens: number;
  textCachedInputTokens: number;
  textOutputTokens: number;
  imageInputTokens: number;
  imageCachedInputTokens: number;
  imageOutputTokens: number;
  usd: number;
};

type Entry = {
  id: string;
  createdAt: string;
  runId: string;
  kind: "chat" | "image";
  label: string;
  model: string;
  patternId?: string;
  quality?: string;
  size?: string;
  cost: Cost;
  rawUsage?: Record<string, unknown>;
};

type Run = {
  runId: string;
  createdAt: string;
  patternId?: string;
  labels: string[];
  models: string[];
  entries: Entry[];
  totals: Cost;
  chatUsd: number;
  imageUsd: number;
};

type Payload = {
  rates: {
    textInputPerM: number;
    textOutputPerM: number;
    imageInputPerM: number;
    imageOutputPerM: number;
  };
  ratesNote: string;
  summary: {
    allTimeUsd: number;
    allTimeFormatted: string;
    chatUsd: number;
    imageUsd: number;
    todayUsd: number;
    todayFormatted: string;
    entryCount: number;
    runCount: number;
    tokens: {
      textInput: number;
      textOutput: number;
      imageInput: number;
      imageOutput: number;
    };
  };
  runs: Run[];
};

export default function AdminUsagePage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [openRun, setOpenRun] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/usage")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Failed to load");
        setData(j);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <AdminShell title="AI usage & costs">
        <p className="text-rose-400">{error}</p>
      </AdminShell>
    );
  }

  if (!data) {
    return (
      <AdminShell title="AI usage & costs">
        <p className="text-slate-400">Loading usage…</p>
      </AdminShell>
    );
  }

  const { summary, rates, runs } = data;

  return (
    <AdminShell title="AI usage & costs">
      <p className="mb-6 max-w-3xl text-sm text-slate-400">
        Costs are estimated from <strong className="text-slate-200">tokens
        returned by OpenAI</strong> on each chat and image call, using public
        list rates. Compare totals with your{" "}
        <a
          href="https://platform.openai.com/usage"
          target="_blank"
          rel="noreferrer"
          className="text-rose-300 underline"
        >
          OpenAI usage dashboard
        </a>
        . Small differences are normal (taxes, retries you cancel, other
        projects on the same key).
      </p>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Last 24h" value={summary.todayFormatted} />
        <Stat label="All logged" value={summary.allTimeFormatted} />
        <Stat label="Content (chat)" value={formatUsd(summary.chatUsd)} />
        <Stat label="Images" value={formatUsd(summary.imageUsd)} />
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tokens logged
          </p>
          <ul className="mt-3 space-y-1 text-slate-300">
            <li>Text in: {summary.tokens.textInput.toLocaleString()}</li>
            <li>Text out: {summary.tokens.textOutput.toLocaleString()}</li>
            <li>Image in: {summary.tokens.imageInput.toLocaleString()}</li>
            <li>Image out: {summary.tokens.imageOutput.toLocaleString()}</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            {summary.entryCount} API calls · {summary.runCount} runs
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Rates used (USD / 1M tokens)
          </p>
          <ul className="mt-3 space-y-1 text-slate-300">
            <li>Text input: ${rates.textInputPerM}</li>
            <li>Text output: ${rates.textOutputPerM}</li>
            <li>Image input: ${rates.imageInputPerM}</li>
            <li>Image output: ${rates.imageOutputPerM}</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Defaults: gpt-5-mini + gpt-image-2.5-flare (OpenAI docs).
          </p>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-white">
        Generation runs
      </h2>
      {runs.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
          No usage logged yet. Run{" "}
          <Link href="/admin/generate" className="text-rose-300 underline">
            AI Generate
          </Link>{" "}
          or regenerate an image — new calls will appear here with token
          costs.
        </p>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => {
            const open = openRun === run.runId;
            return (
              <div
                key={run.runId}
                className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
              >
                <button
                  type="button"
                  onClick={() => setOpenRun(open ? null : run.runId)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-800/50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {run.labels.join(" · ") || "AI run"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {new Date(run.createdAt).toLocaleString()}
                      {run.patternId
                        ? ` · pattern ${run.patternId.slice(0, 8)}…`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-slate-400">
                      chat {formatUsd(run.chatUsd)}
                    </span>
                    <span className="text-slate-400">
                      image {formatUsd(run.imageUsd)}
                    </span>
                    <span className="font-bold text-emerald-400">
                      {formatUsd(run.totals.usd)}
                    </span>
                  </div>
                </button>
                {open ? (
                  <div className="border-t border-slate-800 px-4 py-3">
                    {run.patternId ? (
                      <Link
                        href={`/admin/patterns/${run.patternId}`}
                        className="mb-3 inline-block text-xs text-rose-300"
                      >
                        Open pattern →
                      </Link>
                    ) : null}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-slate-500">
                          <tr>
                            <th className="py-2 pr-3">Kind</th>
                            <th className="py-2 pr-3">Label</th>
                            <th className="py-2 pr-3">Model</th>
                            <th className="py-2 pr-3">Tokens</th>
                            <th className="py-2 pr-3">Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {run.entries.map((e) => (
                            <tr
                              key={e.id}
                              className="border-t border-slate-800/80 text-slate-300"
                            >
                              <td className="py-2 pr-3 capitalize">{e.kind}</td>
                              <td className="py-2 pr-3">{e.label}</td>
                              <td className="py-2 pr-3 font-mono text-[11px]">
                                {e.model}
                                {e.quality ? ` · q=${e.quality}` : ""}
                                {e.size ? ` · ${e.size}` : ""}
                              </td>
                              <td className="py-2 pr-3 font-mono text-[11px]">
                                {e.kind === "chat"
                                  ? `in ${e.cost.textInputTokens + e.cost.textCachedInputTokens} / out ${e.cost.textOutputTokens}`
                                  : `txt ${e.cost.textInputTokens} · img in ${e.cost.imageInputTokens} · img out ${e.cost.imageOutputTokens}`}
                              </td>
                              <td className="py-2 pr-3 font-semibold text-emerald-300">
                                {formatUsd(e.cost.usd)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
