"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, GraduationCap, X } from "lucide-react";
import type { PatternRound } from "@/types";
import { pickLocalized } from "@/types";
import type { TechniqueKey } from "@/lib/crochet/technique-tutor";
import { techniquesForRound } from "@/lib/crochet/technique-tutor";
import {
  TechniqueVisual,
  techniqueFrameCount,
} from "@/components/site/TechniqueVisuals";
import {
  getBeginnerTipsEnabled,
  setBeginnerTipsEnabled,
  subscribeStudioPrefs,
} from "@/lib/client/studio-prefs";
import { cn } from "@/lib/utils";
import type { TechniquePublic } from "@/types/techniques";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

const TECH_MSG: Record<string, string> = {
  magic_ring: "mr",
  sc: "sc",
  inc: "inc",
  dec: "dec",
  fo: "fo",
};

export function TechniqueTutor({
  round,
  library,
}: {
  round: PatternRound;
  /** Published CMS techniques — preferred over SVG + message fallbacks. */
  library?: TechniquePublic[];
}) {
  const t = useTranslations("techniques");
  const locale = useLocale() as Locale;
  const keys = techniquesForRound(round);
  const byKey = useMemo(() => {
    const map = new Map<string, TechniquePublic>();
    for (const tech of library || []) map.set(tech.key, tech);
    return map;
  }, [library]);

  const [tipsOn, setTipsOn] = useState(true);
  const [active, setActive] = useState<TechniqueKey | null>(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setTipsOn(getBeginnerTipsEnabled());
    return subscribeStudioPrefs(() =>
      setTipsOn(getBeginnerTipsEnabled())
    );
  }, []);

  useEffect(() => {
    setActive(null);
    setFrame(0);
  }, [round.round, round.instructions]);

  if (!keys.length) return null;

  function open(key: TechniqueKey) {
    setActive(key);
    setFrame(0);
  }

  function toggleTips() {
    const next = !tipsOn;
    setTipsOn(next);
    setBeginnerTipsEnabled(next);
    if (!next) setActive(null);
  }

  const cms = active ? byKey.get(active) : undefined;
  const msgKey = active ? TECH_MSG[active] : null;

  const title = cms
    ? pickLocalized(cms.title, locale)
    : msgKey
      ? t(`${msgKey}.title`)
      : "";
  const tip = cms
    ? pickLocalized(cms.tip, locale)
    : msgKey
      ? t(`${msgKey}.tip`)
      : "";

  const steps = cms
    ? cms.steps.map((s) => pickLocalized(s.body, locale))
    : msgKey && Array.isArray(t.raw(`${msgKey}.steps`))
      ? (t.raw(`${msgKey}.steps`) as string[])
      : [];
  const captions = cms
    ? cms.steps.map((s) => pickLocalized(s.caption, locale))
    : msgKey && Array.isArray(t.raw(`${msgKey}.frames`))
      ? (t.raw(`${msgKey}.frames`) as string[])
      : [];

  const hasImages = Boolean(
    (cms?.professionallyReady || cms?.technicallyApproved) &&
      cms.steps.some((s) => s.imagePath)
  );
  const frameTotal = cms
    ? Math.max(cms.steps.length, 1)
    : active
      ? techniqueFrameCount(active as TechniqueKey)
      : 0;
  const stepImage = cms?.steps[frame]?.imagePath;

  return (
    <div className="mt-4 rounded-[1.15rem] border border-line/80 bg-bg/60 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
          <GraduationCap className="h-3.5 w-3.5" strokeWidth={2.25} />
          {t("beginnerTips")}
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/learn"
            className="text-xs font-bold text-muted transition hover:text-ink"
          >
            {t("fullLibrary")}
          </Link>
          <button
            type="button"
            onClick={toggleTips}
            className="text-xs font-bold text-muted transition hover:text-ink"
          >
            {tipsOn ? t("hideTips") : t("showTips")}
          </button>
        </div>
      </div>

      {tipsOn ? (
        <>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {keys.map((key) => {
              const on = active === key;
              const lib = byKey.get(key);
              const label = lib
                ? pickLocalized(lib.title, locale)
                : TECH_MSG[key]
                  ? t(`${TECH_MSG[key]}.title`)
                  : key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => (on ? setActive(null) : open(key))}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-bold transition",
                    on
                      ? "bg-apricot text-bone"
                      : "bg-elevated text-ink hover:bg-apricot/15"
                  )}
                >
                  {t("howTo")} {label}
                </button>
              );
            })}
          </div>

          {active && (cms || msgKey) ? (
            <div className="mt-3 overflow-hidden rounded-[1.15rem] border border-line bg-[#fffdf9]">
              <div className="flex items-start justify-between gap-2 border-b border-line px-3 py-2.5 sm:px-4">
                <div className="min-w-0">
                  <p className="font-display text-lg text-ink sm:text-xl">
                    {title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{tip}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-elevated text-ink"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-0 sm:grid-cols-[1.1fr_0.9fr]">
                <div className="border-b border-line p-3 sm:border-b-0 sm:border-r sm:p-4">
                  {hasImages && stepImage ? (
                    <div className="overflow-hidden rounded-[1.15rem] border border-line bg-[linear-gradient(165deg,#fffdf9,#f3ebe0)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={stepImage}
                        alt=""
                        className="aspect-[4/3] w-full object-contain"
                      />
                    </div>
                  ) : (
                    <TechniqueVisual
                      technique={active as TechniqueKey}
                      frame={Math.min(
                        frame,
                        Math.max(0, techniqueFrameCount(active as TechniqueKey) - 1)
                      )}
                    />
                  )}
                  <p className="mt-2 text-center text-sm font-semibold text-ink">
                    {captions[frame] || ""}
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={frame <= 0}
                      onClick={() => setFrame((f) => Math.max(0, f - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-bg disabled:opacity-35"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: frameTotal }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFrame(i)}
                          className={cn(
                            "h-2 w-2 rounded-full transition",
                            i === frame ? "bg-apricot" : "bg-elevated"
                          )}
                          aria-label={`Frame ${i + 1}`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={frame >= frameTotal - 1}
                      onClick={() =>
                        setFrame((f) => Math.min(frameTotal - 1, f + 1))
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-bg disabled:opacity-35"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  {cms?.slug ? (
                    <p className="mt-3 text-center">
                      <Link
                        href={`/learn/${cms.slug}`}
                        className="text-xs font-bold text-apricot hover:underline"
                      >
                        {t("openGuide")}
                      </Link>
                    </p>
                  ) : null}
                </div>

                <ol className="space-y-2.5 p-3 sm:p-4">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-ink">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-apricot/15 text-xs font-bold text-apricot">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
