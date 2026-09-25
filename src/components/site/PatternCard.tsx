"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { formatPrice, pickLocalized, type CrochetPattern } from "@/types";
import type { Locale } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

export function PatternCard({
  pattern,
  locale,
  index = 0,
}: {
  pattern: CrochetPattern;
  locale: Locale;
  index?: number;
}) {
  const t = useTranslations("patterns");
  const tc = useTranslations("common");
  const title = pickLocalized(pattern.content.title, locale);
  const summary = pickLocalized(pattern.content.summary, locale);
  const src = pattern.thumbnailPath || pattern.imagePath;
  const remote = Boolean(src && /^https?:\/\//i.test(src));
  const priceLabel = pattern.free
    ? t("free")
    : formatPrice(pattern.priceCents, pattern.currency);

  return (
    <Link
      href={`/patterns/${pattern.slug}`}
      className="pattern-tile group block h-full"
      style={{ transitionDelay: `${Math.min(index, 6) * 40}ms` }}
    >
      <article className="pattern-card relative flex h-full flex-col overflow-hidden">
        <div className="pattern-card__stage relative mx-3 mt-3 overflow-hidden rounded-[1.15rem]">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            aria-hidden
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(217,107,82,0.14),transparent_55%),radial-gradient(ellipse_at_80%_80%,rgba(143,165,139,0.22),transparent_50%),linear-gradient(165deg,#f7f1e8_0%,#ebe3d6_100%)]" />
            <div className="absolute inset-0 dot-pattern opacity-40" />
          </div>

          <div className="relative flex aspect-[5/4] items-center justify-center p-4 sm:p-5">
            {src ? (
              <Image
                src={src}
                alt={title}
                fill
                unoptimized={remote}
                className="object-contain drop-shadow-[0_12px_28px_rgba(43,37,34,0.14)] transition duration-700 ease-out group-hover:scale-[1.04] group-hover:-translate-y-1"
                sizes="(max-width:768px) 100vw, 33vw"
              />
            ) : (
              <div className="absolute inset-6 rounded-2xl bg-[radial-gradient(circle_at_35%_30%,#d96b52aa,transparent_50%),radial-gradient(circle_at_70%_70%,#8fa58baa,transparent_45%)]" />
            )}
          </div>

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-bone/95 px-2.5 py-1 text-[11px] font-bold tracking-wide text-ink shadow-[0_4px_14px_rgba(43,37,34,0.08)] backdrop-blur-sm">
              {priceLabel}
            </span>
            {pattern.featured ? (
              <span className="rounded-full bg-apricot px-2.5 py-1 text-[11px] font-bold tracking-wide text-bone shadow-[0_4px_14px_rgba(217,107,82,0.28)]">
                Featured
              </span>
            ) : null}
          </div>

          <span className="absolute bottom-3 right-3 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-ink text-bone opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 px-5 pb-5 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-celadon/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-celadon">
              {tc(pattern.designSpec.difficulty)}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted/70">
              {pattern.free ? t("free") : t("paid")}
            </span>
          </div>

          <h3 className="font-display text-[1.35rem] leading-[1.2] text-ink transition-colors group-hover:text-apricot-deep sm:text-[1.45rem]">
            {title}
          </h3>

          <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
            {summary}
          </p>

          <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-apricot">
            View pattern
            <span
              aria-hidden
              className="inline-block transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </div>
      </article>
    </Link>
  );
}
