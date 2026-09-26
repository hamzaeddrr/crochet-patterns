import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPublishedTechniques } from "@/lib/data/techniques-store";
import { pickLocalized } from "@/types";
import type { Locale } from "@/i18n/routing";
import { GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LearnPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: loc } = await params;
  const locale = loc as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("learn");
  const techniques = await getPublishedTechniques();

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-6">
      <header className="max-w-2xl">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
          <GraduationCap className="h-3.5 w-3.5" strokeWidth={2.25} />
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
          {t("subtitle")}
        </p>
      </header>

      {techniques.length === 0 ? (
        <p className="mt-12 text-muted">{t("empty")}</p>
      ) : (
        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {techniques.map((tech) => {
            const cover =
              tech.steps.find((s) => s.imagePath)?.imagePath || tech.sheetPath;
            return (
              <li key={tech.id}>
                <Link
                  href={`/learn/${tech.slug}`}
                  className="group flex h-full gap-4 rounded-[1.25rem] border border-line bg-bg/70 p-3 transition hover:border-apricot/40 hover:bg-elevated/40"
                >
                  <div className="h-24 w-28 shrink-0 overflow-hidden rounded-[1rem] border border-line bg-[linear-gradient(165deg,#fffdf9,#f3ebe0)]">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-bold text-muted">
                        {tech.steps.length} {t("steps")}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 py-1">
                    <h2 className="font-display text-xl text-ink group-hover:text-apricot">
                      {pickLocalized(tech.title, locale)}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      {pickLocalized(tech.tip, locale)}
                    </p>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-gold">
                      {tech.steps.length} {t("steps")}
                      {tech.youtubeUrl ? ` · ${t("hasVideo")}` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
