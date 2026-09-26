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

  const embed = youtubeEmbedUrl(technique.youtubeUrl);
  const others = (await getPublishedTechniques()).filter(
    (x) => x.id !== technique.id
  );

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>

      <header className="mt-6">
        <h1 className="font-display text-4xl text-ink sm:text-5xl">
          {pickLocalized(technique.title, locale)}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
          {pickLocalized(technique.tip, locale)}
        </p>
      </header>

      {embed ? (
        <div className="mt-8 overflow-hidden rounded-[1.25rem] border border-line bg-ink/5">
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

      <ol className="mt-10 space-y-8">
        {technique.steps.map((step, i) => (
          <li key={i} className="grid gap-4 sm:grid-cols-[1.05fr_0.95fr] sm:items-start">
            <div className="overflow-hidden rounded-[1.15rem] border border-line bg-[linear-gradient(165deg,#fffdf9,#f3ebe0)]">
              {step.imagePath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={step.imagePath}
                  alt=""
                  className="aspect-[4/3] w-full object-contain"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted">
                  {t("step")} {i + 1}
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
                {t("step")} {i + 1}
              </p>
              <h2 className="mt-1 font-display text-2xl text-ink">
                {pickLocalized(step.caption, locale)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                {pickLocalized(step.body, locale)}
              </p>
            </div>
          </li>
        ))}
      </ol>

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
