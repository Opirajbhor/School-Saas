export type Locale = "en" | "bn";

export const LOCALES: Locale[] = ["en", "bn"];

export const DEFAULT_LOCALE: Locale = "en";

/** Cookie that carries the choice; read on the server so the first paint is right. */
export const LOCALE_COOKIE = "educare-locale";

export const isLocale = (value: string | undefined): value is Locale =>
  value === "en" || value === "bn";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  bn: "বাংলা",
};
