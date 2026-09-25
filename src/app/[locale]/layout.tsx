import type { Metadata } from "next";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { locales, type Locale } from "@/i18n/routing";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { siteUrl } from "@/lib/utils";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: messages.meta.defaultTitle,
      template: `%s · Loopcraft`,
    },
    description: messages.meta.defaultDescription,
    alternates: {
      languages: {
        en: "/",
        fr: "/fr",
        es: "/es",
        "x-default": "/",
      },
    },
    openGraph: {
      type: "website",
      siteName: "Loopcraft",
      title: messages.meta.defaultTitle,
      description: messages.meta.defaultDescription,
      locale: locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "es_ES",
    },
    twitter: {
      card: "summary_large_image",
      title: messages.meta.defaultTitle,
      description: messages.meta.defaultDescription,
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!locales.includes(localeParam as Locale)) notFound();
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <SiteHeader locale={locale} />
      <main className="min-h-[70vh]">{children}</main>
      <SiteFooter />
    </NextIntlClientProvider>
  );
}
