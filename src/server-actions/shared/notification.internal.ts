// Server-only helpers for notifications — deliberately NOT a "use server"
// module. Every export of an action module is a public RPC endpoint, so the
// fan-out helper and the id lookups must stay off the wire: any caller could
// otherwise push arbitrary notifications into any user's bell.

import { eq } from "drizzle-orm";

import { db } from "@/src/drizzle-DB";
import { notifications, user } from "@/src/drizzle-DB/schema";

/**
 * Fan a notification out to a set of users. Never throws: a failed notification
 * must not roll back the change that caused it.
 */
export async function notifyUsers({
  userIds,
  type,
  title,
  body,
  href,
}: {
  userIds: (string | null | undefined)[];
  type: string;
  title: string;
  body?: string | null;
  href?: string | null;
}) {
  const unique = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return;

  try {
    await db.insert(notifications).values(
      unique.map((userId) => ({
        userId,
        type,
        title,
        body: body ?? null,
        href: href ?? null,
      })),
    );
  } catch (error) {
    console.error("notifyUsers failed:", error);
  }
}

/** Everyone who should hear about a ticket in this institute: its admins. */
export async function instituteAdminIds(instituteId: string | null) {
  if (!instituteId) return [];
  try {
    const rows = await db.query.instituteProfile.findMany({
      where: (profile, { eq }) => eq(profile.id, instituteId),
      columns: { userId: true },
    });
    return rows.map((row) => row.userId);
  } catch {
    return [];
  }
}

/** Every platform admin. */
export async function superAdminIds() {
  try {
    const rows = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.role, "superadmin"));
    return rows.map((row) => row.id);
  } catch {
    return [];
  }
}
