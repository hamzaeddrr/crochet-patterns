"use client";

import { useCallback, useRef, useState, type PointerEvent } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Rect = { x: number; y: number; w: number; h: number };

export function TechniqueManualCropper({
  sheetPath,
  stepCount,
  stepLabels,
  onClose,
  onCrop,
}: {
  sheetPath: string;
  stepCount: number;
  stepLabels: string[];
  onClose: () => void;
  onCrop: (region: {
    x: number;
    y: number;
    width: number;
    height: number;
    target: "auto" | "bonus" | number;
  }) => Promise<void>;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [rect, setRect] = useState<Rect | null>(null);
  const [target, setTarget] = useState<"auto" | "bonus" | number>("auto");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const toFrac = useCallback((clientX: number, clientY: number) => {
    const img = imgRef.current;
    if (!img) return { x: 0, y: 0 };
    const r = img.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (clientY - r.top) / r.height)),
    };
  }, []);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (busy) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const p = toFrac(e.clientX, e.clientY);
    setDragStart(p);
    setRect({ x: p.x, y: p.y, w: 0, h: 0 });
    setErr("");
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragStart || busy) return;
    const p = toFrac(e.clientX, e.clientY);
    const x = Math.min(dragStart.x, p.x);
    const y = Math.min(dragStart.y, p.y);
    const w = Math.abs(p.x - dragStart.x);
    const h = Math.abs(p.y - dragStart.y);
    setRect({ x, y, w, h });
  }

  function onPointerUp() {
    setDragStart(null);
  }

  async function confirm() {
    if (!rect || rect.w < 0.02 || rect.h < 0.02) {
      setErr("Draw a larger box on the image first");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await onCrop({
        x: rect.x,
        y: rect.y,
        width: rect.w,
        height: rect.h,
        target,
      });
      setRect(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Crop failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6">
      <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Manual crop</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Drag a box on the sheet. Each crop fills the next empty step, or
              goes to bonus if all steps have images.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-3">
          <div
            className="relative mx-auto inline-block max-w-full touch-none select-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={sheetPath}
              alt="Sheet to crop"
              draggable={false}
              className="max-h-[60vh] w-auto max-w-full cursor-crosshair rounded-lg"
            />
            {rect && rect.w > 0 && rect.h > 0 ? (
              <div
                className="pointer-events-none absolute border-2 border-emerald-400 bg-emerald-400/20"
                style={{
                  left: `${rect.x * 100}%`,
                  top: `${rect.y * 100}%`,
                  width: `${rect.w * 100}%`,
                  height: `${rect.h * 100}%`,
                }}
              />
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 px-4 py-3">
          <label className="text-xs text-slate-400">
            Assign to
            <select
              value={
                target === "auto" || target === "bonus" ? target : String(target)
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v === "auto" || v === "bonus") setTarget(v);
                else setTarget(Number(v));
              }}
              className="ml-2 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white"
            >
              <option value="auto">Next empty step (or bonus)</option>
              {Array.from({ length: stepCount }).map((_, i) => (
                <option key={i} value={i}>
                  Step {i + 1}
                  {stepLabels[i] ? ` — ${stepLabels[i]}` : ""}
                </option>
              ))}
              <option value="bonus">Bonus images</option>
            </select>
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={confirm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            <Check className="h-4 w-4" />
            {busy ? "Saving…" : "Crop & assign"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setRect(null)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300"
          >
            Clear box
          </button>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "ml-auto rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white"
            )}
          >
            Done
          </button>
          {err ? (
            <p className="w-full text-xs text-rose-300">{err}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
