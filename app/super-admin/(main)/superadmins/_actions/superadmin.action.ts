"use server";
import { auth } from "@/auth";
import { db } from "@/src/drizzle-DB";
import { user } from "@/src/drizzle-DB/schema";
import { teachers } from "@/src/drizzle-DB/schema";
import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/src/server-actions/auth/currentUser.action";
import { parseWithZod } from "@/src/validation/validator.zod";
import {
  createSuperAdminZod,
  CreateSuperAdminInput,
  promoteSuperAdminZod,
  PromoteSuperAdminInput,
  SuperAdminType,
} from "@/src/validation/superadmin.zod";
import { createAuditLog } from "@/src/server-actions/audit-logs/createAuditLog.action";

type SessionUser = { id: string; email: string; role?: string };

// Platform-wide records, so every action here is superadmin-only.
//
// This reads the role straight off the session rather than through
// getUserContext(): that helper returns null unless the user has a `teachers`
// row, and a superadmin created from this page has no institute and therefore
// no such row. Using it would lock new superadmins out of their own panel.
async function requireSuperAdmin() {
  const session = await currentUser();
  const ctx = session?.user as SessionUser | undefined;
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
      details: {},
    };
  }
  if (ctx.role !== "superadmin") {
    return { success: false as const, error: "Not authorized", details: {} };
  }
  return { success: true as const, data: ctx };
}

// The last superadmin must not lose the role, or nobody can reach this panel
// again and the only way back in is a manual UPDATE on the database.
async function countOtherSuperAdmins(excludeId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user)
    .where(and(eq(user.role, "superadmin"), ne(user.id, excludeId)));
  return row?.count ?? 0;
}

// ---------------- list ----------------
export async function getSuperAdmins() {
  const guard = await requireSuperAdmin();
  if (!guard.success) return guard;

  try {
    const rows = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.role, "superadmin"))
      .orderBy(user.createdAt);

    return { success: true as const, data: rows as SuperAdminType[] };
  } catch (error) {
    console.error("getSuperAdmins failed:", error);
    return {
      success: false as const,
      error: "Failed to load superadmins",
      details: {},
    };
  }
}

// ---------------- create a new superadmin account ----------------
export async function createSuperAdminAction(data: CreateSuperAdminInput) {
  const guard = await requireSuperAdmin();
  if (!guard.success) return guard;

  const parsed = parseWithZod(createSuperAdminZod, data);
  if (!parsed.success) return parsed;

  try {
    // better-auth hashes the password; it is never stored in plain text.
    const created = await auth.api.createUser({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        role: "superadmin",
      },
    });

    if (!created?.user?.id) {
      return {
        success: false as const,
        error: "Failed to create superadmin",
        details: {},
      };
    }

    revalidatePath("/super-admin/superadmins");
    return { success: true as const, data: created.user };
  } catch (error) {
    console.error("createSuperAdminAction failed:", error);
    // better-auth reports a duplicate e-mail as a thrown APIError, so surface
    // that rather than the generic message.
    const message =
      error instanceof Error && /exist/i.test(error.message)
        ? "A user with this email already exists"
        : "Failed to create superadmin";
    return { success: false as const, error: message, details: {} };
  }
}

// ---------------- promote an existing account ----------------
export async function promoteToSuperAdmin(data: PromoteSuperAdminInput) {
  const guard = await requireSuperAdmin();
  if (!guard.success) return guard;

  const parsed = parseWithZod(promoteSuperAdminZod, data);
  if (!parsed.success) return parsed;

  try {
    const result = await db.transaction(async (tx) => {
      const [target] = await tx
        .select({ id: user.id, email: user.email, role: user.role })
        .from(user)
        .where(eq(user.email, parsed.data.email))
        .limit(1);

      if (!target) {
        return {
          success: false as const,
          error: "No account found with that email",
          details: {},
        };
      }
      if (target.role === "superadmin") {
        return {
          success: false as const,
          error: "That account is already a superadmin",
          details: {},
        };
      }

      const [updated] = await tx
        .update(user)
        .set({ role: "superadmin" })
        .where(eq(user.id, target.id))
        .returning();

      return { success: true as const, data: updated };
    });

    if (!result.success) return result;

    revalidatePath("/super-admin/superadmins");
    return { success: true as const, data: result.data };
  } catch (error) {
    console.error("promoteToSuperAdmin failed:", error);
    return {
      success: false as const,
      error: "Failed to promote user",
      details: {},
    };
  }
}

// ---------------- demote back to a regular user ----------------
export async function demoteToUser(id: string) {
  const guard = await requireSuperAdmin();
  if (!guard.success) return guard;

  try {
    const result = await db.transaction(async (tx) => {
      const [target] = await tx
        .select({ id: user.id, email: user.email, role: user.role })
        .from(user)
        .where(eq(user.id, id))
        .limit(1);

      if (!target) {
        return {
          success: false as const,
          error: "Account not found",
          details: {},
        };
      }

      // Self-demotion would end the session's own authority mid-request.
      if (target.id === guard.data.id) {
        return {
          success: false as const,
          error: "You cannot remove your own superadmin access",
          details: {},
        };
      }

      const remaining = await countOtherSuperAdmins(target.id);
      if (remaining === 0) {
        return {
          success: false as const,
          error: "At least one superadmin must remain",
          details: {},
        };
      }

      const [updated] = await tx
        .update(user)
        .set({ role: "user" })
        .where(eq(user.id, target.id))
        .returning();

      // audit_logs.instituteId is NOT NULL, and a superadmin has no institute of
      // its own, so only record the change when the actor has one. The action
      // itself still succeeds either way.
      const actorInstitute = await tx.query.teachers.findFirst({
        where: eq(teachers.userId, guard.data.id),
        columns: { instituteId: true },
      });
      if (actorInstitute?.instituteId && updated) {
        await createAuditLog(tx, {
          instituteId: actorInstitute.instituteId,
          userId: guard.data.id,
          entity: "TEACHER",
          entityId: target.id,
          action: "STATUS_CHANGED",
          description: `Demoted ${target.email} from superadmin to user`,
          metadata: { email: target.email, from: "superadmin", to: "user" },
        });
      }

      return { success: true as const, data: updated };
    });

    if (!result.success) return result;

    revalidatePath("/super-admin/superadmins");
    return { success: true as const, data: result.data };
  } catch (error) {
    console.error("demoteToUser failed:", error);
    return {
      success: false as const,
      error: "Failed to demote superadmin",
      details: {},
    };
  }
}
