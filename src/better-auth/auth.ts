import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  advanced: {
    // Only disable the origin check while working on your computer (development)
    disableOriginCheck: process.env.NODE_ENV !== "production",
    disableCSRFCheck: process.env.NODE_ENV !== "production",
  },
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true, // Tells Better Auth to match token layouts cleanly
    },
  },
  plugins: [nextCookies()],
});
