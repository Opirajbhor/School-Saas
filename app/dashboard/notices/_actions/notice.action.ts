"use server";

/**
 * Platform notices — the institute side.
 *
 * Read state is per institute, so opening a notice here marks it read for the
 * whole school (whoever opened it is recorded for the audit trail).
 */

import { and, desc, eq, gte, ilike, isNull, lte, or, sql } from "drizzle-orm";

import { db } from "@/src/drizzle-DB";
import {
  instituteProfile,
  noticeReads,
  notices,
  noticeTargets,
} from "@/src/drizzle-DB/schema";
import { getSessionContext } from "@/src/server-actions/shared/get-session-context.action";
import {
  InputInstituteNoticeFilterType,
  instituteNoticeFilterZod,
} from "@/app/super-admin/(main)/notices/_schema/notice.zod";
import { sweepNotices } from "@/app/super-admin/(main)/notices/_lib/notice.internal";

const FAILED = {
  success: false as const,
  error: "Something went wrong. Please try again.",
  details: {},
} as const;

async function requireInstitute() {
  const ctx = await getSessionContext();
  if (!ctx?.instituteId) {
    return { success: false as const, error: "Not authorized", details: {} };
  }
  return { success: true as const, data: ctx };
}

/** Live = published, due, not archived, not expired. */
const liveNotice = () =>
  and(
    sql`${notices.publishedAt} is not null`,
    lte(notices.publishAt, new Date()),
    isNull(notices.archivedAt),
    or(isNull(notices.expiresAt), gte(notices.expiresAt, new Date())),
  );

export async function listNotices(filters: InputInstituteNoticeFilterType) {
  const auth = await requireInstitute();
  if (!auth.success) return auth;
  const { instituteId, userId } = auth.data;

  const parsed = instituteNoticeFilterZod.safeParse(filters);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid filters", details: {} };
  }
  const f = parsed.data;

  // a scheduled notice becomes visible (and is notified) the first time the
  // list is opened after its publish date
  await sweepNotices();

  try {
    const conditions = [eq(noticeTargets.instituteId, instituteId), liveNotice()];

    if (f.q) {
      conditions.push(
        or(ilike(notices.title, `%${f.q}%`), ilike(notices.body, `%${f.q}%`)),
      );
    }
    if (f.priority !== "ALL") conditions.push(eq(notices.priority, f.priority));
    if (f.read === "READ") conditions.push(sql`${noticeReads.readAt} is not null`);
    if (f.read === "UNREAD") conditions.push(isNull(noticeReads.readAt));
    if (f.from) conditions.push(gte(notices.publishAt, new Date(f.from)));
    if (f.to) {
      const to = new Date(f.to);
      to.setHours(23, 59, 59, 999);
      conditions.push(lte(notices.publishAt, to));
    }

    const where = and(...conditions);
    const offset = (f.page - 1) * f.perPage;

    const [rows, countRows, badge] = await Promise.all([
      db
        .select({
          id: notices.id,
          title: notices.title,
          body: notices.body,
          priority: notices.priority,
          publishAt: notices.publishAt,
          expiresAt: notices.expiresAt,
          pinned: notices.pinned,
          readAt: noticeReads.readAt,
        })
        .from(noticeTargets)
        .innerJoin(notices, eq(notices.id, noticeTargets.noticeId))
        .leftJoin(
          noticeReads,
          and(
            eq(noticeReads.noticeId, notices.id),
            eq(noticeReads.instituteId, instituteId),
          ),
        )
        .where(where)
        .orderBy(
          desc(notices.pinned),
          sql`case ${notices.priority} when 'URGENT' then 0 when 'IMPORTANT' then 1 else 2 end`,
          desc(notices.publishAt),
        )
        .limit(f.perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(noticeTargets)
        .innerJoin(notices, eq(notices.id, noticeTargets.noticeId))
        .leftJoin(
          noticeReads,
          and(
            eq(noticeReads.noticeId, notices.id),
            eq(noticeReads.instituteId, instituteId),
          ),
        )
        .where(where),
      unreadCount(instituteId),
    ]);

    const total = countRows[0]?.count ?? 0;

    return {
      success: true as const,
      data: {
        items: rows.map((row) => ({
          ...row,
          preview: row.body.replace(/[#*_>\-`[\]]/g, "").slice(0, 180),
          unread: row.readAt === null,
        })),
        total,
        unread: badge,
        page: f.page,
        pages: Math.max(1, Math.ceil(total / f.perPage)),
        viewerId: userId,
      },
    };
  } catch (error) {
    console.error("listNotices failed:", error);
    return FAILED;
  }
}

async function unreadCount(instituteId: string) {
  try {
    const [row] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(noticeTargets)
      .innerJoin(notices, eq(notices.id, noticeTargets.noticeId))
      .leftJoin(
        noticeReads,
        and(
          eq(noticeReads.noticeId, notices.id),
          eq(noticeReads.instituteId, instituteId),
        ),
      )
      .where(
        and(
          eq(noticeTargets.instituteId, instituteId),
          liveNotice(),
          isNull(noticeReads.readAt),
        ),
      );
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}

/** Badge count for the shell. */
export async function getNoticeBadge() {
  const ctx = await getSessionContext();
  if (!ctx?.instituteId) return 0;
  return unreadCount(ctx.instituteId);
}

/** Open one notice — marks it read for the institute. */
export async function getNotice(id: string) {
  const auth = await requireInstitute();
  if (!auth.success) return auth;
  const { instituteId, userId } = auth.data;

  try {
    const [row] = await db
      .select({
        id: notices.id,
        title: notices.title,
        body: notices.body,
        attachments: notices.attachments,
        priority: notices.priority,
        publishAt: notices.publishAt,
        expiresAt: notices.expiresAt,
        pinned: notices.pinned,
        createdByName: notices.createdByName,
      })
      .from(noticeTargets)
      .innerJoin(notices, eq(notices.id, noticeTargets.noticeId))
      .where(
        and(eq(noticeTargets.noticeId, id), eq(noticeTargets.instituteId, instituteId)),
      )
      .limit(1);

    if (!row) {
      return { success: false as const, error: "Notice not found", details: {} };
    }

    await db
      .insert(noticeReads)
      .values({ noticeId: id, instituteId, readByUserId: userId })
      .onConflictDoUpdate({
        target: [noticeReads.noticeId, noticeReads.instituteId],
        set: { readAt: new Date(), readByUserId: userId },
      });

    const [institute] = await db
      .select({ name: instituteProfile.nameEnglish })
      .from(instituteProfile)
      .where(eq(instituteProfile.id, instituteId))
      .limit(1);

    return {
      success: true as const,
      data: { ...row, instituteName: institute?.name ?? "" },
    };
  } catch (error) {
    console.error("getNotice failed:", error);
    return FAILED;
  }
}

/** Mark every live notice read for this institute. */
export async function markAllNoticesRead() {
  const auth = await requireInstitute();
  if (!auth.success) return auth;
  const { instituteId, userId } = auth.data;

  try {
    const live = await db
      .select({ noticeId: noticeTargets.noticeId })
      .from(noticeTargets)
      .innerJoin(notices, eq(notices.id, noticeTargets.noticeId))
      .leftJoin(
        noticeReads,
        and(
          eq(noticeReads.noticeId, notices.id),
          eq(noticeReads.instituteId, instituteId),
        ),
      )
      .where(
        and(
          eq(noticeTargets.instituteId, instituteId),
          liveNotice(),
          isNull(noticeReads.readAt),
        ),
      );

    if (live.length > 0) {
      await db
        .insert(noticeReads)
        .values(
          live.map((row) => ({
            noticeId: row.noticeId,
            instituteId,
            readByUserId: userId,
          })),
        )
        .onConflictDoNothing();
    }

    return { success: true as const, data: { marked: live.length } };
  } catch (error) {
    console.error("markAllNoticesRead failed:", error);
    return FAILED;
  }
}
