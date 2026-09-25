"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { pickLocalized, type CrochetPattern } from "@/types";
import type { Locale } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function PatternCard({
  pattern,
  locale,
}: {
  pattern: CrochetPattern;
  locale: Locale;
  index?: number;
}) {
  const t = useTranslations("patterns");
  const tc = useTranslations("common");
  const title = pickLocalized(pattern.content.title, locale);
  const summary = pickLocalized(pattern.content.summary, locale);

  return (
    <Link href={`/patterns/${pattern.slug}`} className="pattern-tile group block">
      <article className="soft-card overflow-hidden">
        <div className="relative aspect-[4/5] overflow-hidden bg-celadon/20">
          {pattern.thumbnailPath || pattern.imagePath ? (
            <Image
              src={pattern.thumbnailPath || pattern.imagePath!}
              alt={title}
              fill
              className="object-cover transition duration-700 group-hover:scale-105"
              sizes="(max-width:768px) 100vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,#d96b52aa,transparent_50%),radial-gradient(circle_at_70%_70%,#8fa58baa,transparent_45%)]" />
          )}
          {pattern.free && (
            <span className="absolute left-3 top-3 rounded-full bg-bg/95 px-3 py-1 text-xs font-bold text-gold shadow-sm">
              {t("free")}
            </span>
          )}
        </div>
        <div className="space-y-2 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-celadon">
            {tc(pattern.designSpec.difficulty)}
          </p>
          <h3 className="font-display text-2xl leading-snug text-ink">{title}</h3>
          <p className="line-clamp-2 text-sm text-muted">{summary}</p>
          <span className="inline-flex pt-1 text-sm font-bold text-apricot transition group-hover:gap-2">
            View pattern <span className="transition group-hover:translate-x-1">→</span>
          </span>
        </div>
      </article>
    </Link>
  );
}
