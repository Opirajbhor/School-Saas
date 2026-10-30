import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../drizzle-DB";
import * as schema from "../drizzle-DB/schema";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";

// The admin plugin only knows "admin" and "user" out of the box. Registering the
// institute roles alongside "superadmin" is what lets adminRoles below accept
// it; without a `roles` map the plugin throws on startup. superadmin gets the
// same permission set as an institute admin.
const adminRoles = {
  superadmin: adminAc,
  admin: adminAc,
  user: userAc,
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  // Trusted origins are listed explicitly. The check used to be switched off by
  // NODE_ENV, which left every non-"production" environment unprotected.
  // Localhost is the dev origin; BETTER_AUTH_URL is the deployed one.
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    "http://localhost:3000",
    "http://localhost:3001",
  ].filter((origin): origin is string => Boolean(origin)),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true, // Tells Better Auth to match token layouts cleanly
    },
  },
  // "admin" must be listed explicitly: the plugin defaults to allowing only the
  // "admin" role, so adding the "superadmin" role to the enum would otherwise
  // take admin rights away from every existing institute admin.
  plugins: [
    admin({
      roles: adminRoles,
      adminRoles: ["admin", "superadmin"],
      defaultRole: "user",
    }),
    nextCookies(),
  ],
});
