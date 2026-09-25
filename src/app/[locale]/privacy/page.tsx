import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: true, follow: true },
};

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-32 sm:px-6">
      <h1 className="font-display text-5xl text-ink">Privacy Policy</h1>
      <div className="soft-card mt-8 p-8 text-lg leading-relaxed text-muted">
        Loopcraft stores only the information needed to run the site (for
        example contact messages you send). We do not sell personal data.
        Pattern downloads may be logged for abuse prevention.
      </div>
    </div>
  );
}
