// Server-only notice helpers — NOT a "use server" module.
//
// `sweepNotices` publishes what is due and archives what expired. Exported from
// the action module it would be a public endpoint that anyone could call to
// publish (and notify) every scheduled notice, bypassing the cron secret.

import { and, eq, inArray, isNull, lte, sql } from "drizzle-orm";

import { db } from "@/src/drizzle-DB";
import {
  instituteProfile,
  notices,
  noticeTargets,
} from "@/src/drizzle-DB/schema";
import { notifyUsers } from "@/src/server-actions/shared/notification.internal";

const FAILED = {
  success: false as const,
  error: "Something went wrong. Please try again.",
  details: {},
} as const;

/** Every institute id, or the selected subset. */
export async function resolveAudience(audience: string, instituteIds: string[]) {
  if (audience === "ALL") {
    const rows = await db.select({ id: instituteProfile.id }).from(instituteProfile);
    return rows.map((row) => row.id);
  }
  if (instituteIds.length === 0) return [];
  const rows = await db
    .select({ id: instituteProfile.id })
    .from(instituteProfile)
    .where(inArray(instituteProfile.id, instituteIds));
  return rows.map((row) => row.id);
}

/** One notification per institute admin; no-op when nothing is targeted. */
export async function notifyInstitutes(
  noticeId: string,
  title: string,
  priority: string,
) {
  const rows = await db
    .select({ userId: instituteProfile.userId })
    .from(noticeTargets)
    .innerJoin(
      instituteProfile,
      eq(instituteProfile.id, noticeTargets.instituteId),
    )
    .where(eq(noticeTargets.noticeId, noticeId));

  await notifyUsers({
    userIds: rows.map((row) => row.userId),
    type: "NOTICE",
    title: `Notice: ${title}`,
    body: priority === "URGENT" ? "Urgent — please read" : null,
    href: `/dashboard/notices/${noticeId}`,
  });
}

/**
 * Publish anything due and archive anything expired.
 *
 * Runs in one transaction and locks the due rows, so two concurrent sweeps
 * (a page render racing the cron) cannot publish — and notify — the same notice
 * twice. The notification only fires for the sweep that actually flipped
 * `published_at`.
 */
export async function sweepNotices() {
  const now = new Date();

  try {
    const published = await db.transaction(async (tx) => {
      const due = await tx
        .select({
          id: notices.id,
          title: notices.title,
          priority: notices.priority,
          audience: notices.audience,
          audienceIds: notices.audienceIds,
        })
        .from(notices)
        .where(
          and(
            isNull(notices.publishedAt),
            lte(notices.publishAt, now),
            isNull(notices.archivedAt),
          ),
        )
        .for("update", { skipLocked: true });

      let count = 0;

      for (const notice of due) {
        // a scheduled notice has no targets yet: expand the audience now
        const existing = await tx
          .select({ id: noticeTargets.id })
          .from(noticeTargets)
          .where(eq(noticeTargets.noticeId, notice.id))
          .limit(1);

        if (existing.length === 0) {
          const ids =
            notice.audience === "ALL"
              ? (await tx.select({ id: instituteProfile.id }).from(instituteProfile))
                  .map((row) => row.id)
              : notice.audienceIds?.length
                ? (
                    await tx
                      .select({ id: instituteProfile.id })
                      .from(instituteProfile)
                      .where(inArray(instituteProfile.id, notice.audienceIds))
                  ).map((row) => row.id)
                : [];

          if (ids.length > 0) {
            await tx
              .insert(noticeTargets)
              .values(ids.map((instituteId) => ({ noticeId: notice.id, instituteId })))
              .onConflictDoNothing();
          }
        }

        // only the sweep that wins this update notifies
        const flipped = await tx
          .update(notices)
          .set({ publishedAt: now, updatedAt: now })
          .where(and(eq(notices.id, notice.id), isNull(notices.publishedAt)))
          .returning({ id: notices.id });

        if (flipped.length > 0) {
          count += 1;
          await notifyInstitutes(notice.id, notice.title, notice.priority);
        }
      }

      await tx
        .update(notices)
        .set({ archivedAt: now, updatedAt: now })
        .where(and(isNull(notices.archivedAt), lte(notices.expiresAt, now)));

      return count;
    });

    return { success: true as const, data: { published } };
  } catch (error) {
    console.error("sweepNotices failed:", error);
    return FAILED;
  }
}

/** Unused today, kept for callers that want the row count of a scope. */
export async function countPublishedNotices(instituteId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(noticeTargets)
    .where(eq(noticeTargets.instituteId, instituteId));
  return row?.count ?? 0;
}
