import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getPublishedTechniques,
  getTechniqueBySlug,
} from "@/lib/data/techniques-store";
import { youtubeEmbedUrl } from "@/lib/crochet/youtube";
import { pickLocalized } from "@/types";
import type { Locale } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [];
}

export default async function LearnTechniquePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: loc, slug } = await params;
  const locale = loc as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("learn");
  const technique = await getTechniqueBySlug(slug);

  if (!technique || !technique.published) notFound();

  const embed = youtubeEmbedUrl(technique.youtubeUrl, {
    startSeconds: technique.youtubeStartSeconds,
    endSeconds: technique.youtubeEndSeconds,
  });
  const showSheet = Boolean(
    technique.showSheetOnPage && technique.sheetPath
  );
  const others = (await getPublishedTechniques()).filter(
    (x) => x.id !== technique.id
  );
  const stepsWithImages = technique.steps.filter((s) => s.imagePath).length;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>

      <header className="mt-6 max-w-3xl">
        <h1 className="font-display text-4xl text-ink sm:text-5xl">
          {pickLocalized(technique.title, locale)}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
          {pickLocalized(technique.tip, locale)}
        </p>
      </header>

      {embed ? (
        <div className="mt-8 mx-auto max-w-4xl overflow-hidden rounded-[1.25rem] border border-line bg-ink/5">
          <div className="aspect-video w-full">
            <iframe
              src={embed}
              title={pickLocalized(technique.title, locale)}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <p className="px-4 py-2 text-xs text-muted">{t("videoCredit")}</p>
        </div>
      ) : null}

      {showSheet ? (
        <figure
          className={cn(
            "overflow-hidden rounded-[1.25rem] border border-line bg-[linear-gradient(165deg,#fffdf9,#f3ebe0)]",
            embed ? "mt-6" : "mt-8"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={technique.sheetPath!}
            alt={t("sheetAlt", {
              title: pickLocalized(technique.title, locale),
            })}
            className="mx-auto block h-auto w-full max-h-[min(92vh,1100px)] object-contain object-top"
          />
          <figcaption className="border-t border-line/70 px-4 py-2.5 text-center text-xs text-muted sm:text-sm">
            {t("sheetCaption")}
          </figcaption>
        </figure>
      ) : null}

      {technique.steps.length > 0 ? (
        <section className="mt-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-2 border-b border-line pb-3">
            <h2 className="font-display text-2xl text-ink sm:text-3xl">
              {t("stepsHeading")}
            </h2>
            <p className="text-sm text-muted">
              {technique.steps.length} {t("steps")}
              {stepsWithImages
                ? ` · ${stepsWithImages} ${t("withPhotos")}`
                : ""}
            </p>
          </div>

          <ol className="mx-auto max-w-4xl space-y-8">
            {technique.steps.map((step, i) => {
              const hasImage = Boolean(step.imagePath);
              return (
                <li
                  key={i}
                  className={cn(
                    hasImage
                      ? "grid gap-5 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] sm:items-start"
                      : "flex gap-4 border-b border-line/60 pb-7 last:border-b-0 last:pb-0"
                  )}
                >
                  {hasImage ? (
                    <div className="overflow-hidden rounded-[1.15rem] border border-line bg-[linear-gradient(165deg,#fffdf9,#f3ebe0)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={step.imagePath}
                        alt=""
                        className="aspect-[4/3] w-full object-contain"
                      />
                    </div>
                  ) : (
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-apricot/15 font-display text-sm text-apricot">
                      {i + 1}
                    </span>
                  )}
                  <div className="min-w-0">
                    {hasImage ? (
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
                        {t("step")} {i + 1}
                      </p>
                    ) : null}
                    <h3
                      className={cn(
                        "font-display text-ink",
                        hasImage ? "mt-1 text-xl sm:text-2xl" : "text-xl"
                      )}
                    >
                      {pickLocalized(step.caption, locale)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                      {pickLocalized(step.body, locale)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {others.length > 0 ? (
        <section className="mt-16 border-t border-line pt-10">
          <h2 className="font-display text-2xl text-ink">{t("more")}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.slice(0, 8).map((o) => (
              <li key={o.id}>
                <Link
                  href={`/learn/${o.slug}`}
                  className="rounded-full border border-line bg-bg px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-apricot/50 hover:bg-apricot/10"
                >
                  {pickLocalized(o.title, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
