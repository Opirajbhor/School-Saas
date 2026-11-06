"use server";

/**
 * Platform notices — the superadmin side.
 *
 * Publishing materialises `notice_targets` (an "all" audience becomes one row per
 * institute) and writes an in-app notification for each institute's admin, so the
 * unread badge is a plain count and the stats screen needs no audience special
 * cases.
 */

import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/src/drizzle-DB";
import {
  instituteProfile,
  noticeReads,
  notices,
  noticeTargets,
  user,
} from "@/src/drizzle-DB/schema";
import { currentUser } from "@/src/server-actions/auth/currentUser.action";
import { notifyUsers } from "@/src/server-actions/shared/notification.internal";
import { notifyInstitutes, resolveAudience } from "../_lib/notice.internal";
import {
  createNoticeZod,
  InputCreateNoticeType,
  InputSuperNoticeFilterType,
  superNoticeFilterZod,
} from "../_schema/notice.zod";

const FAILED = {
  success: false as const,
  error: "Something went wrong. Please try again.",
  details: {},
} as const;

async function requireSuper() {
  const session = await currentUser();
  const account = session?.user as { id?: string; role?: string; name?: string } | undefined;

  if (!account?.id) {
    return { success: false as const, error: "No User session found", details: {} };
  }
  if (account.role !== "superadmin") {
    return { success: false as const, error: "Not authorized", details: {} };
  }
  return { success: true as const, data: account as { id: string; name?: string } };
}

// ---------------------------------------------------------------- create
export async function createNotice(data: InputCreateNoticeType) {
  const auth = await requireSuper();
  if (!auth.success) return auth;

  const parsed = createNoticeZod.safeParse(data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    };
  }
  const input = parsed.data;

  try {
    const publishAt = new Date(input.publishAt);
    const isDue = publishAt.getTime() <= Date.now();

    const [notice] = await db
      .insert(notices)
      .values({
        createdById: auth.data.id,
        createdByName: auth.data.name ?? "Platform admin",
        title: input.title,
        body: input.body,
        attachments: input.attachments,
        priority: input.priority,
        audience: input.audience,
        audienceIds: input.audience === "SELECTED" ? input.instituteIds : [],
        publishAt,
        publishedAt: isDue ? new Date() : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        pinned: input.pinned,
      })
      .returning({ id: notices.id });

    if (!notice) return FAILED;

    // targets are only materialised when the notice actually goes out, so
    // "delivered" never counts institutes that have not been notified yet
    if (isDue) {
      const ids = await resolveAudience(input.audience, input.instituteIds);
      if (ids.length > 0) {
        await db
          .insert(noticeTargets)
          .values(ids.map((instituteId) => ({ noticeId: notice.id, instituteId })))
          .onConflictDoNothing();
      }
      await notifyInstitutes(notice.id, input.title, input.priority);
    }

    revalidatePath("/super-admin/notices");
    revalidatePath("/dashboard/notices");
    return { success: true as const, data: { id: notice.id, scheduled: !isDue } };
  } catch (error) {
    console.error("createNotice failed:", error);
    return FAILED;
  }
}

// ---------------------------------------------------------------- publish now
export async function publishNotice(id: string) {
  const auth = await requireSuper();
  if (!auth.success) return auth;

  try {
    const [notice] = await db
      .select()
      .from(notices)
      .where(eq(notices.id, id))
      .limit(1);

    if (!notice) {
      return { success: false as const, error: "Notice not found", details: {} };
    }

    const targets = await db
      .select({ id: noticeTargets.id })
      .from(noticeTargets)
      .where(eq(noticeTargets.noticeId, id));

    if (targets.length === 0) {
      const ids = await resolveAudience(notice.audience, notice.audienceIds ?? []);
      if (ids.length > 0) {
        await db
          .insert(noticeTargets)
          .values(ids.map((instituteId) => ({ noticeId: id, instituteId })))
          .onConflictDoNothing();
      }
    }

    await db
      .update(notices)
      .set({ publishedAt: new Date(), publishAt: new Date(), updatedAt: new Date() })
      .where(eq(notices.id, id));

    await notifyInstitutes(id, notice.title, notice.priority);

    revalidatePath("/super-admin/notices");
    revalidatePath("/dashboard/notices");
    return { success: true as const, data: null };
  } catch (error) {
    console.error("publishNotice failed:", error);
    return FAILED;
  }
}

// ---------------------------------------------------------------- mutate
export async function toggleNoticePin(id: string, pinned: boolean) {
  const auth = await requireSuper();
  if (!auth.success) return auth;

  try {
    await db
      .update(notices)
      .set({ pinned, updatedAt: new Date() })
      .where(eq(notices.id, id));
    revalidatePath("/super-admin/notices");
    revalidatePath("/dashboard/notices");
    return { success: true as const, data: null };
  } catch (error) {
    console.error("toggleNoticePin failed:", error);
    return FAILED;
  }
}

export async function archiveNotice(id: string, archived = true) {
  const auth = await requireSuper();
  if (!auth.success) return auth;

  try {
    await db
      .update(notices)
      .set({ archivedAt: archived ? new Date() : null, updatedAt: new Date() })
      .where(eq(notices.id, id));
    revalidatePath("/super-admin/notices");
    revalidatePath("/dashboard/notices");
    return { success: true as const, data: null };
  } catch (error) {
    console.error("archiveNotice failed:", error);
    return FAILED;
  }
}

export async function deleteNotice(id: string) {
  const auth = await requireSuper();
  if (!auth.success) return auth;

  try {
    await db.delete(notices).where(eq(notices.id, id));
    revalidatePath("/super-admin/notices");
    revalidatePath("/dashboard/notices");
    return { success: true as const, data: null };
  } catch (error) {
    console.error("deleteNotice failed:", error);
    return FAILED;
  }
}

// ---------------------------------------------------------------- list
export async function listNotices(filters: InputSuperNoticeFilterType) {
  const auth = await requireSuper();
  if (!auth.success) return auth;

  const parsed = superNoticeFilterZod.safeParse(filters);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid filters", details: {} };
  }
  const f = parsed.data;
  const now = new Date();

  try {
    const conditions = [];

    if (f.q) {
      conditions.push(
        or(ilike(notices.title, `%${f.q}%`), ilike(notices.body, `%${f.q}%`)),
      );
    }
    if (f.priority !== "ALL") conditions.push(eq(notices.priority, f.priority));
    if (f.status === "SCHEDULED") {
      conditions.push(and(isNull(notices.publishedAt), isNull(notices.archivedAt)));
    }
    if (f.status === "LIVE") {
      conditions.push(and(sql`${notices.publishedAt} is not null`, isNull(notices.archivedAt)));
    }
    if (f.status === "ARCHIVED") {
      conditions.push(sql`${notices.archivedAt} is not null`);
    }

    const where = conditions.length ? and(...conditions) : undefined;
    const offset = (f.page - 1) * f.perPage;

    const [rows, countRows] = await Promise.all([
      db
        .select({
          id: notices.id,
          title: notices.title,
          priority: notices.priority,
          audience: notices.audience,
          publishAt: notices.publishAt,
          publishedAt: notices.publishedAt,
          expiresAt: notices.expiresAt,
          pinned: notices.pinned,
          archivedAt: notices.archivedAt,
          createdAt: notices.createdAt,
          delivered:
            sql<number>`(select count(*)::int from notice_targets t where t.notice_id = notices.id)`.mapWith(
              Number,
            ),
          read: sql<number>`(select count(*)::int from notice_reads r where r.notice_id = notices.id)`.mapWith(
            Number,
          ),
        })
        .from(notices)
        .where(where)
        .orderBy(desc(notices.pinned), desc(notices.publishAt))
        .limit(f.perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(notices)
        .where(where),
    ]);

    const total = countRows[0]?.count ?? 0;

    return {
      success: true as const,
      data: {
        items: rows.map((row) => ({
          ...row,
          state:
            row.archivedAt !== null
              ? "ARCHIVED"
              : row.publishedAt === null
                ? "SCHEDULED"
                : "LIVE",
        })),
        total,
        page: f.page,
        pages: Math.max(1, Math.ceil(total / f.perPage)),
      },
    };
  } catch (error) {
    console.error("listNotices failed:", error);
    return FAILED;
  }
}

// ---------------------------------------------------------------- stats
export async function getNoticeStats(id: string) {
  const auth = await requireSuper();
  if (!auth.success) return auth;

  try {
    const [notice] = await db
      .select({
        id: notices.id,
        title: notices.title,
        priority: notices.priority,
        audience: notices.audience,
        publishAt: notices.publishAt,
        publishedAt: notices.publishedAt,
        expiresAt: notices.expiresAt,
      })
      .from(notices)
      .where(eq(notices.id, id))
      .limit(1);

    if (!notice) {
      return { success: false as const, error: "Notice not found", details: {} };
    }

    const targets = await db
      .select({
        instituteId: instituteProfile.id,
        name: instituteProfile.nameEnglish,
        district: instituteProfile.district,
        readAt: noticeReads.readAt,
      })
      .from(noticeTargets)
      .innerJoin(
        instituteProfile,
        eq(instituteProfile.id, noticeTargets.instituteId),
      )
      .leftJoin(
        noticeReads,
        and(
          eq(noticeReads.noticeId, noticeTargets.noticeId),
          eq(noticeReads.instituteId, noticeTargets.instituteId),
        ),
      )
      .where(eq(noticeTargets.noticeId, id))
      .orderBy(asc(instituteProfile.nameEnglish));

    const readers = targets.filter((row) => row.readAt !== null);
    const nonReaders = targets.filter((row) => row.readAt === null);

    return {
      success: true as const,
      data: {
        notice,
        delivered: targets.length,
        read: readers.length,
        unread: nonReaders.length,
        readers: readers.map((row) => ({
          instituteId: row.instituteId,
          name: row.name,
          readAt: row.readAt,
        })),
        nonReaders: nonReaders.map((row) => ({
          instituteId: row.instituteId,
          name: row.name,
          district: row.district,
        })),
      },
    };
  } catch (error) {
    console.error("getNoticeStats failed:", error);
    return FAILED;
  }
}

/** Institutes to pick from in the composer. */
export async function getAudienceOptions() {
  const auth = await requireSuper();
  if (!auth.success) return auth;

  try {
    const rows = await db
      .select({
        id: instituteProfile.id,
        name: instituteProfile.nameEnglish,
        district: instituteProfile.district,
        adminEmail: user.email,
      })
      .from(instituteProfile)
      .leftJoin(user, eq(user.id, instituteProfile.userId))
      .orderBy(asc(instituteProfile.nameEnglish));

    return { success: true as const, data: rows };
  } catch (error) {
    console.error("getAudienceOptions failed:", error);
    return FAILED;
  }
}
