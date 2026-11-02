import { cookies } from "next/headers";

import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { bn } from "./dictionaries/bn";
import { en, type Dictionary } from "./dictionaries/en";

const dictionaries: Record<Locale, Dictionary> = { en, bn };

/** Server-side locale, read from the cookie the switcher writes. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function dictionaryFor(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Locale + copy in one call, for layouts and server pages. */
export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: dictionaryFor(locale) };
}
