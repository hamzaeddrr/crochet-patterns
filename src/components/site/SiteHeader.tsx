"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

function YarnMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden
      fill="none"
    >
      <circle cx="20" cy="20" r="15" fill="#D96B52" />
      <path
        d="M10 18c4-6 16-6 20 0M9 23c5-5 17-5 22 0M12 14c3 8 13 10 17 4"
        stroke="#FAF7F2"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="20" cy="20" r="3" fill="#C49A5A" />
    </svg>
  );
}

export function SiteHeader({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const tm = useTranslations("meta");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/patterns" as const, label: t("patterns") },
    { href: "/learn" as const, label: t("learn") },
    { href: "/library" as const, label: t("library") },
    { href: "/categories" as const, label: t("categories") },
    { href: "/blog" as const, label: t("blog") },
    { href: "/about" as const, label: t("about") },
    { href: "/contact" as const, label: t("contact") },
  ];

  const languages: { code: Locale; label: string }[] = [
    { code: "en", label: "EN" },
    { code: "fr", label: "FR" },
    { code: "es", label: "ES" },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-[1.75rem] border px-4 py-3 transition duration-300 sm:px-5",
          scrolled
            ? "border-ink/10 bg-bg/95 shadow-[0_12px_40px_rgba(43,37,34,0.08)] backdrop-blur-md"
            : "border-ink/5 bg-bg/70 backdrop-blur-sm"
        )}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <YarnMark className="h-9 w-9" />
          <span className="font-display text-xl tracking-tight text-ink sm:text-2xl">
            {tm("siteName")}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-muted transition hover:bg-elevated hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full bg-elevated p-1 text-[11px] font-bold">
            {languages.map((l) => (
              <Link
                key={l.code}
                href={pathname}
                locale={l.code}
                prefetch={false}
                className={cn(
                  "rounded-full px-2.5 py-1 transition",
                  locale === l.code
                    ? "bg-ink text-bone"
                    : "text-muted hover:text-ink"
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <button
            type="button"
            className="rounded-full bg-elevated p-2 md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-auto mt-2 max-w-6xl rounded-[1.5rem] border border-ink/10 bg-bg p-5 shadow-lg md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-3 py-3 font-display text-xl text-ink hover:bg-elevated"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
