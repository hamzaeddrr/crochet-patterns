import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Terms of Use",
  robots: { index: true, follow: true },
};

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-32 sm:px-6">
      <h1 className="font-display text-5xl text-ink">Terms of Use</h1>
      <div className="soft-card mt-8 p-8 text-lg leading-relaxed text-muted">
        Patterns on Loopcraft are for personal use unless a listing states
        commercial rights. You may not redistribute PDF files. AI-assisted
        drafts should be tested before use in finished products you sell.
      </div>
    </div>
  );
}
