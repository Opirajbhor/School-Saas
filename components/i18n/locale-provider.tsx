"use client";

import { createContext, useContext } from "react";

import type { Locale } from "@/src/i18n/config";
import type { Dictionary } from "@/src/i18n/dictionaries/en";

const LocaleContext = createContext<{
  locale: Locale;
  t: Dictionary;
} | null>(null);

/** Client components read copy through this; the value comes from the layout. */
export function LocaleProvider({
  locale,
  t,
  children,
}: {
  locale: Locale;
  t: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={{ locale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useT() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useT must be used inside <LocaleProvider>");
  }
  return context.t;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used inside <LocaleProvider>");
  }
  return context.locale;
}
