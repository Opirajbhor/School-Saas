"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { currentUser } from "@/src/server-actions/auth/currentUser.action";
import { LOCALE_COOKIE, isLocale, type Locale } from "./config";

/**
 * Persist the chosen language. A cookie rather than a URL segment: every page
 * keeps its path, and the server can render the right language on first paint.
 */
export async function setLocale(locale: Locale) {
  if (!isLocale(locale)) return { success: false as const };

  // a public action: without a session it is a free global-cache-busting button
  const session = await currentUser();
  if (!session?.user) return { success: false as const };

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
