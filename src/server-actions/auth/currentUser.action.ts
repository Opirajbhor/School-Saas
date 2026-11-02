"use server";
import { cache } from "react";
import { auth } from "@/auth";
import { headers } from "next/headers";

export type sessionUserType = {
  email: string;
  emailVerified: boolean;
  name: string;
};

/**
 * Cached per request: a page that renders five data actions used to hit the
 * session endpoint five times. `cache` collapses those into one.
 */
export const currentUser = cache(async () => {
  return await auth.api.getSession({
    headers: await headers(),
  });
});


