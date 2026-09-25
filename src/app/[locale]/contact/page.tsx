import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { readSiteContent } from "@/lib/data/store";
import { pickLocalized } from "@/types";
import { pageSeoMetadata } from "@/lib/seo/page-meta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return pageSeoMetadata("contact", locale, "/contact", {
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const { pages } = await readSiteContent();
  const page = pages.contact;
  const title = page?.heroTitle
    ? pickLocalized(page.heroTitle, locale) || t("title")
    : t("title");
  const subtitle = page?.body
    ? pickLocalized(page.body, locale) || t("subtitle")
    : t("subtitle");

  return (
    <div className="mx-auto max-w-xl px-4 pb-20 pt-32 sm:px-6">
      <h1 className="font-display text-5xl text-ink">{title}</h1>
      <p className="mt-4 text-lg text-muted">{subtitle}</p>
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
