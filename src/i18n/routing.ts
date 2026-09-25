import { defineRouting } from "next-intl/routing";

export const locales = ["en", "fr", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
};

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: "as-needed",
  // Only switch language via URL / language buttons — not browser Accept-Language.
  localeDetection: false,
});
