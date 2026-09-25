import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { siteUrl } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const prefix = locale === "en" ? "" : `/${locale}`;
  return {
    title: t("title"),
    description: t("body"),
    alternates: { canonical: `${siteUrl()}${prefix}/about` },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("about");
  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-32 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
        Our story
      </p>
      <h1 className="mt-3 font-display text-5xl text-ink sm:text-6xl">
        {t("title")}
      </h1>
      <div className="soft-card mt-8 p-8">
        <p className="text-lg leading-relaxed text-muted">{t("body")}</p>
      </div>
    </div>
  );
}
