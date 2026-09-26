import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublishedPatterns } from "@/lib/data/store";
import { LibraryClient } from "@/components/site/LibraryClient";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: loc } = await params;
  const locale = loc as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("library");
  const tn = await getTranslations("nav");
  const patterns = await getPublishedPatterns();

  return (
    <LibraryClient
      patterns={patterns}
      locale={locale}
      labels={{
        title: t("title"),
        subtitle: t("subtitle"),
        saved: t("saved"),
        recent: t("recent"),
        emptySaved: t("emptySaved"),
        emptyRecent: t("emptyRecent"),
        browse: tn("browse"),
      }}
    />
  );
}
