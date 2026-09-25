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
  const t = await getTranslations({ locale, namespace: "blog" });
  const prefix = locale === "en" ? "" : `/${locale}`;
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: { canonical: `${siteUrl()}${prefix}/blog` },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("blog");
  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-32 sm:px-6">
      <h1 className="font-display text-5xl text-ink">{t("title")}</h1>
      <p className="mt-4 text-lg text-muted">{t("subtitle")}</p>
      <div className="soft-card mt-10 p-10 text-center text-muted">
        {t("empty")}
      </div>
    </div>
  );
}
