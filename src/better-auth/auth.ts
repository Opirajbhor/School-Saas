import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../drizzle-DB";
import * as schema from "../drizzle-DB/schema";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { adminAc, defaultAc, userAc } from "better-auth/plugins/admin/access";

// Every /admin/* route under /api/auth/[...all] gates only on these permissions
// (see better-auth's plugins/admin/routes.mjs), so binding institute admins to
// the stock `adminAc` let any institute admin POST /admin/set-role on itself and
// become superadmin. Institute admins therefore get a restricted controller:
// only `user: [create]`, which is what addTeacher needs, and no session rights.
const instituteAdminAc = defaultAc.newRole({
  user: ["create"],
  session: [],
});

// The admin plugin only knows "admin" and "user" out of the box. Registering the
// institute roles alongside "superadmin" is what lets adminRoles below accept
// it; without a `roles` map the plugin throws on startup.
const adminRoles = {
  superadmin: adminAc,
  admin: instituteAdminAc,
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
    // The session is signed into a cookie, so the common case (dashboard,
    // every action) validates without a database round trip. A page render
    // cannot write a cookie, so the window has to be long enough that a normal
    // browsing session never falls back to the database with every page load:
    // measured at 5 minutes, every request past that paid 4 extra round trips
    // (~210 ms). The shell refreshes this cookie while the user browses.
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24,
    },
  },
  // Only the platform role is a Better Auth "admin". Institute admins are
  // regular users that happen to hold one application-level permission
  // (`user: [create]`), so the plugin's admin-only handful of routes
  // (set-role, set-password, list-users, impersonate, delete) stays closed.
  plugins: [
    admin({
      roles: adminRoles,
      adminRoles: ["superadmin"],
      defaultRole: "user",
    }),
    nextCookies(),
  ],
});
