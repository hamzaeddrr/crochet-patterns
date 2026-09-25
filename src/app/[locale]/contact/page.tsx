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
  const t = await getTranslations({ locale, namespace: "contact" });
  const prefix = locale === "en" ? "" : `/${locale}`;
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: { canonical: `${siteUrl()}${prefix}/contact` },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("contact");
  return (
    <div className="mx-auto max-w-xl px-4 pb-20 pt-32 sm:px-6">
      <h1 className="font-display text-5xl text-ink">{t("title")}</h1>
      <p className="mt-4 text-lg text-muted">{t("subtitle")}</p>
      <form
        className="soft-card mt-8 space-y-5 p-6"
        action="mailto:hello@loopcraft.patterns"
        method="get"
      >
        <label className="block text-sm font-bold">
          {t("emailLabel")}
          <input
            type="email"
            name="email"
            required
            className="mt-2 w-full rounded-2xl border border-line bg-bg px-4 py-3 outline-none transition focus:border-apricot"
          />
        </label>
        <label className="block text-sm font-bold">
          {t("messageLabel")}
          <textarea
            name="body"
            required
            rows={5}
            className="mt-2 w-full rounded-2xl border border-line bg-bg px-4 py-3 outline-none transition focus:border-apricot"
          />
        </label>
        <button type="submit" className="btn-primary">
          {t("send")}
        </button>
      </form>
      <p className="mt-4 text-xs text-muted">{t("note")}</p>
    </div>
  );
}
