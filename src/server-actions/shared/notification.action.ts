"use server";

import { and, eq, inArray, isNull, count } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/src/drizzle-DB";
import { notifications } from "@/src/drizzle-DB/schema";
import { getSessionContext } from "../shared/get-session-context.action";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export const getNotifications = cache(async (): Promise<NotificationRow[]> => {
  const ctx = await getSessionContext();
  if (!ctx) return [];

  try {
    return await db.query.notifications.findMany({
      where: (row, { eq }) => eq(row.userId, ctx.userId),
      orderBy: (row, { desc }) => [desc(row.createdAt)],
      limit: 25,
    });
  } catch (error) {
    console.error("getNotifications failed:", error);
    return [];
  }
});

/** Unread count for the topbar badge. */
export const getUnreadNotificationCount = cache(async () => {
  const ctx = await getSessionContext();
  if (!ctx) return 0;

  try {
    const [row] = await db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, ctx.userId), isNull(notifications.readAt)),
      );
    return row?.count ?? 0;
  } catch {
    return 0;
  }
});

/** Mark the given notifications read (all of mine when no ids are passed). */
export async function markNotificationsRead(ids?: string[]) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return { success: false as const, error: "Not authorized", details: {} };
  }

  try {
    const mine = eq(notifications.userId, ctx.userId);
    const where = ids?.length ? and(mine, inArray(notifications.id, ids)) : mine;

    await db.update(notifications).set({ readAt: new Date() }).where(where);
    return { success: true as const, data: null };
  } catch (error) {
    console.error("markNotificationsRead failed:", error);
    return {
      success: false as const,
      error: "Something went wrong. Please try again.",
      details: {},
    };
  }
}
