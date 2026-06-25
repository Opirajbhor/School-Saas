import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || undefined,
});

// Optionally re-export helpers from the client if callers import them.
export const { signIn, signUp, useSession } = authClient;
