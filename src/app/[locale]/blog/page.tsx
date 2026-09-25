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
  const t = await getTranslations({ locale, namespace: "blog" });
  return pageSeoMetadata("blog", locale, "/blog", {
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const { blogPosts } = await readSiteContent();
  const published = blogPosts.filter((p) => p.status === "published");

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-32 sm:px-6">
      <h1 className="font-display text-5xl text-ink">{t("title")}</h1>
      <p className="mt-4 text-lg text-muted">{t("subtitle")}</p>
      {published.length === 0 ? (
        <div className="soft-card mt-10 p-10 text-center text-muted">
          {t("empty")}
        </div>
      ) : (
        <ul className="mt-10 space-y-6">
          {published.map((post) => (
            <li key={post.id} className="soft-card p-6">
              <h2 className="font-display text-3xl text-ink">
                {pickLocalized(post.title, locale)}
              </h2>
              <p className="mt-2 text-muted">
                {pickLocalized(post.excerpt, locale)}
              </p>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {pickLocalized(post.body, locale)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
