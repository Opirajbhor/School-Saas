import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || undefined,
  plugins: [adminClient()],
});

// Optionally re-export helpers from the client if callers import them.
export const { signIn, signUp, useSession } = authClient;
