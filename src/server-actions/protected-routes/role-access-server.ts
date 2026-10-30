// src/lib/auth/can.ts

import { currentUser } from "../auth/currentUser.action";

type Role = "superadmin" | "admin" | "user";

export async function AccessServer(roles: Role | Role[]) {
  const profile = await currentUser();
  const ctx = profile?.user;
  if (!ctx) return { allowed: false as const, ctx: null };

  const list = Array.isArray(roles) ? roles : [roles];
  // the session user type does not declare role, so read it through a lookup
  // rather than widening the shared schema type
  const role = (ctx as { role?: Role }).role;
  const allowed = role ? list.includes(role) : false;

  return { allowed, ctx };
}

// ussage
// const { allowed, ctx } = await AccessServer("admin");

// if (!allowed) return redirect("/unauthorize");
