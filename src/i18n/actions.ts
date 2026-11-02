"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { LOCALE_COOKIE, isLocale, type Locale } from "./config";

/**
 * Persist the chosen language. A cookie rather than a URL segment: every page
 * keeps its path, and the server can render the right language on first paint.
 */
export async function setLocale(locale: Locale) {
  if (!isLocale(locale)) return { success: false as const };

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  // the shell and the nav live in the root layout
  revalidatePath("/", "layout");
  return { success: true as const };
}
