import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("footer");
  const tm = useTranslations("meta");
  const tn = useTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-line bg-elevated">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="font-display text-4xl text-ink sm:text-5xl">
              {tm("siteName")}
            </p>
            <p className="mt-3 max-w-sm text-muted">{t("tagline")}</p>
            <div className="mt-6 flex gap-2">
              <span className="h-3 w-3 rounded-full bg-apricot" />
              <span className="h-3 w-3 rounded-full bg-celadon" />
              <span className="h-3 w-3 rounded-full bg-gold" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm font-semibold text-ink/80">
            <Link href="/patterns" className="hover:text-apricot">
              {tn("patterns")}
            </Link>
            <Link href="/categories" className="hover:text-apricot">
              {tn("categories")}
            </Link>
            <Link href="/about" className="hover:text-apricot">
              {tn("about")}
            </Link>
            <Link href="/contact" className="hover:text-apricot">
              {tn("contact")}
            </Link>
            <Link href="/privacy" className="hover:text-apricot">
              {t("privacy")}
            </Link>
            <Link href="/terms" className="hover:text-apricot">
              {t("terms")}
            </Link>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:justify-between">
          <span>
            © {year} {tm("siteName")}. {t("rights")}
          </span>
          <span className="font-semibold tracking-wide">EN · FR · ES</span>
        </div>
      </div>
    </footer>
  );
}
