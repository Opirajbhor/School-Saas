// src/lib/auth/can.ts

import { currentUser } from "../server-actions/auth/currentUser.action";

type Role = "admin" | "user";

export async function AccessServer(roles: Role | Role[]) {
  const profile = await currentUser();
  const ctx = profile?.user;
  if (!ctx) return { allowed: false as const, ctx: null };

  const list = Array.isArray(roles) ? roles : [roles];
  const allowed = list.includes(ctx.role as Role);

  return { allowed, ctx };
}

// ussage
// const { allowed, ctx } = await AccessServer("admin");

// if (!allowed) return redirect("/unauthorize");
