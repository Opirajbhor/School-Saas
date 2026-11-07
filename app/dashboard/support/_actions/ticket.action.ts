"use server";

/**
 * Support tickets.
 *
 * Scoping rules, in one place so the UI can never widen them:
 *   teacher (`user`)  → tickets they opened or are assigned, in their institute
 *   institute admin   → every ticket of their institute (both scopes)
 *   superadmin        → every ticket on the platform
 *
 * A teacher leaving deletes their `teachers` row; tickets keep the snapshot of
 * the author's name and email, so nothing is orphaned.
 */

import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/src/drizzle-DB";
import {
  instituteProfile,
  supportAttachments,
  supportMessages,
  supportTickets,
  teachers,
  user,
} from "@/src/drizzle-DB/schema";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";
import {
  instituteAdminIds,
  notifyUsers,
  superAdminIds,
} from "@/src/server-actions/shared/notification.internal";
import {
  assignTicketZod,
  changeStatusZod,
  createTicketZod,
  InputTicketFilterType,
  replyTicketZod,
  ticketFilterZod,
  TicketPriority,
  TicketStatus,
} from "../_schema/ticket.zod";

const FAILED = {
  success: false as const,
  error: "Something went wrong. Please try again.",
  details: {},
} as const;

const HOUR = 60 * 60 * 1000;

/** Response target per priority; drives the ageing indicator. */
const DUE_AFTER: Record<TicketPriority, number> = {
  HIGH: 24 * HOUR,
  MEDIUM: 3 * 24 * HOUR,
  LOW: 7 * 24 * HOUR,
};

const TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["OPEN", "RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED", "OPEN"],
  CLOSED: ["OPEN"],
};

async function requireSupportAccess() {
  // raw session lookup would keep a suspended institute's support desk open
  const ctx = await getUserContext();
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
      details: {},
    };
  }

  // a teacher works inside their institute; an admin needs one too; a
  // superadmin has no institute and sees everything
  if (ctx.role !== "superadmin" && !ctx.instituteId) {
    return { success: false as const, error: "Not authorized", details: {} };
  }

  return {
    success: true as const,
    data: {
      ...ctx,
      isSuper: ctx.role === "superadmin",
      isAdmin: ctx.role === "admin" || ctx.role === "superadmin",
    },
  };
}

/** The author label stored on the ticket: the teacher's name, else the account. */
async function authorIdentity(ctx: {
  userId: string;
  teacherId: string;
}) {
  if (ctx.teacherId) {
    const [row] = await db
      .select({ name: teachers.nameEnglish, email: teachers.email })
      .from(teachers)
      .where(eq(teachers.id, ctx.teacherId))
      .limit(1);
    if (row) return { name: row.name, email: row.email };
  }

  const [account] = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, ctx.userId))
    .limit(1);

  return { name: account?.name ?? "Unknown", email: account?.email ?? null };
}


/**
 * Attachments are uploaded by the browser, so the stored metadata is untrusted.
 * Only accept files that live in this tenant's own support folder: otherwise a
 * member could attach an arbitrary external URL (phishing, tracking pixel) or
 * another institute's asset, which the ticket view renders directly.
 */
function validateAttachments(
  files: { url: string; name: string; mime?: string; size?: number }[],
  instituteId: string,
) {
  if (files.length === 0) return { ok: true as const };

  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloud) {
    return {
      ok: false as const,
      error: "Attachments are not configured on this server",
    };
  }

  const base = `https://res.cloudinary.com/${cloud}/`;
  const folder = instituteId ? `/educare/${instituteId}/support/` : "/educare/";
  const allowedMime = /^(image\/(png|jpe?g|webp)|application\/pdf)$/i;

  for (const file of files) {
    if (!file.url.startsWith(base) || !file.url.includes(folder)) {
      return {
        ok: false as const,
        error: "Attachment was not uploaded from this institute's folder",
      };
    }
    if (file.size != null && file.size > 5 * 1024 * 1024) {
      return { ok: false as const, error: "An attachment is larger than 5 MB" };
    }
    if (file.mime && !allowedMime.test(file.mime)) {
      return { ok: false as const, error: "Only images and PDFs can be attached" };
    }
  }

  return { ok: true as const };
}

/** Where a ticket lives, for links in notifications and the UI. */
function ticketHref(ticketId: string, isSuper: boolean) {
  return `${isSuper ? "/super-admin/support" : "/dashboard/support"}/${ticketId}`;
}

// ---------------------------------------------------------------- create
export async function createTicket(data: unknown) {
  const auth = await requireSupportAccess();
  if (!auth.success) return auth;
  const ctx = auth.data;

  const parsed = createTicketZod.safeParse(data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    };
  }
  const input = parsed.data;

  // a teacher can only talk to their institute; an admin may address the
  // platform directly; a superadmin always opens at platform scope
  const scope = ctx.isSuper
    ? "PLATFORM"
    : ctx.isAdmin
      ? input.scope
      : "INSTITUTE";

  const attachmentCheck = validateAttachments(input.attachments, ctx.instituteId);
  if (!attachmentCheck.ok) {
    return { success: false as const, error: attachmentCheck.error, details: {} };
  }

  try {
    const author = await authorIdentity(ctx);
    const now = new Date();

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        instituteId: ctx.isSuper ? null : ctx.instituteId,
        scope,
        subject: input.subject,
        description: input.description,
        category: input.category,
        priority: input.priority,
        status: "OPEN",
        createdById: ctx.userId,
        createdByRole: ctx.role ?? "user",
        createdByName: author.name,
        createdByEmail: author.email,
        dueAt: new Date(now.getTime() + DUE_AFTER[input.priority]),
        lastReplyAt: now,
      })
      .returning({ id: supportTickets.id });

    if (!ticket) return FAILED;

    const [message] = await db
      .insert(supportMessages)
      .values({
        ticketId: ticket.id,
        authorId: ctx.userId,
        authorRole: ctx.role ?? "user",
        authorName: author.name,
        body: input.description,
        isInternal: false,
      })
      .returning({ id: supportMessages.id });

    if (input.attachments.length > 0) {
      await db.insert(supportAttachments).values(
        input.attachments.map((file) => ({
          ticketId: ticket.id,
          messageId: message?.id ?? null,
          url: file.url,
          name: file.name,
          mime: file.mime ?? null,
          size: file.size ?? null,
        })),
      );
    }

    // notify the other side of the conversation
    const recipients =
      scope === "PLATFORM"
        ? await superAdminIds()
        : await instituteAdminIds(ctx.instituteId);

    await notifyUsers({
      userIds: recipients,
      type: "TICKET_CREATED",
      title: `New ticket: ${input.subject}`,
      body: `${author.name} · ${input.priority.toLowerCase()} priority`,
      href: ticketHref(ticket.id, scope === "PLATFORM"),
    });

    revalidatePath("/dashboard/support");
    revalidatePath("/super-admin/support");
    return { success: true as const, data: { id: ticket.id } };
  } catch (error) {
    console.error("createTicket failed:", error);
    return FAILED;
  }
}

// ---------------------------------------------------------------- list
export type TicketListItem = {
  id: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  scope: string;
  createdAt: Date;
  lastReplyAt: Date | null;
  dueAt: Date | null;
  resolvedAt: Date | null;
  createdByName: string;
  assignedToName: string | null;
  messageCount: number;
  overdue: boolean;
};

export async function listTickets(filters: InputTicketFilterType) {
  const auth = await requireSupportAccess();
  if (!auth.success) return auth;
  const ctx = auth.data;

  const parsed = ticketFilterZod.safeParse(filters);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid filters", details: {} };
  }
  const f = parsed.data;

  try {
    const scopeWhere = ctx.isSuper
      ? undefined
      : ctx.isAdmin
        ? eq(supportTickets.instituteId, ctx.instituteId)
        : and(
            eq(supportTickets.instituteId, ctx.instituteId),
            or(
              eq(supportTickets.createdById, ctx.userId),
              eq(supportTickets.assignedToId, ctx.userId),
            ),
          );

    const conditions = [scopeWhere];

    if (f.q) {
      conditions.push(
        or(
          ilike(supportTickets.subject, `%${f.q}%`),
          ilike(supportTickets.description, `%${f.q}%`),
          ilike(supportTickets.createdByName, `%${f.q}%`),
        ),
      );
    }
    if (f.status !== "ALL") conditions.push(eq(supportTickets.status, f.status));
    if (f.priority !== "ALL") {
      conditions.push(eq(supportTickets.priority, f.priority));
    }
    if (f.category !== "ALL") {
      conditions.push(eq(supportTickets.category, f.category));
    }
    if (f.scope !== "ALL") conditions.push(eq(supportTickets.scope, f.scope));
    if (f.from) conditions.push(gte(supportTickets.createdAt, new Date(f.from)));
    if (f.to) {
      const to = new Date(f.to);
      to.setHours(23, 59, 59, 999);
      conditions.push(lte(supportTickets.createdAt, to));
    }

    const where = and(...conditions);
    const offset = (f.page - 1) * f.perPage;

    const [rows, countRows] = await Promise.all([
      db
        .select({
          id: supportTickets.id,
          subject: supportTickets.subject,
          category: supportTickets.category,
          priority: supportTickets.priority,
          status: supportTickets.status,
          scope: supportTickets.scope,
          createdAt: supportTickets.createdAt,
          lastReplyAt: supportTickets.lastReplyAt,
          dueAt: supportTickets.dueAt,
          resolvedAt: supportTickets.resolvedAt,
          createdByName: supportTickets.createdByName,
          assignedToName: supportTickets.assignedToName,
        })
        .from(supportTickets)
        .where(where)
        // open work first, then newest
        .orderBy(
          asc(sql`case when ${supportTickets.status} in ('OPEN','IN_PROGRESS') then 0 else 1 end`),
          desc(supportTickets.createdAt),
        )
        .limit(f.perPage)
        .offset(offset),
      db
        .select({ count: count() })
        .from(supportTickets)
        .where(where),
    ]);

    // message counts for the page, in one grouped query instead of a
    // correlated subquery per row
    const messageCounts =
      rows.length > 0
        ? await db
            .select({
              ticketId: supportMessages.ticketId,
              count: count(),
            })
            .from(supportMessages)
            .where(
              inArray(
                supportMessages.ticketId,
                rows.map((row) => row.id),
              ),
            )
            .groupBy(supportMessages.ticketId)
        : [];

    const messageCountById = new Map(
      messageCounts.map((row) => [row.ticketId, row.count]),
    );

    const now = Date.now();
    const items: TicketListItem[] = rows.map((row) => ({
      ...row,
      messageCount: messageCountById.get(row.id) ?? 0,
      overdue:
        Boolean(row.dueAt) &&
        row.status !== "RESOLVED" &&
        row.status !== "CLOSED" &&
        new Date(row.dueAt as Date).getTime() < now,
    }));

    const total = countRows[0]?.count ?? 0;

    return {
      success: true as const,
      data: {
        items,
        total,
        page: f.page,
        perPage: f.perPage,
        pages: Math.max(1, Math.ceil(total / f.perPage)),
      },
    };
  } catch (error) {
    console.error("listTickets failed:", error);
    return FAILED;
  }
}

// ---------------------------------------------------------------- detail
export type TicketMessage = {
  id: string;
  authorRole: string;
  authorName: string;
  body: string;
  isInternal: boolean;
  createdAt: Date;
  attachments: { id: string; url: string; name: string }[];
};

export async function getTicket(ticketId: string) {
  const auth = await requireSupportAccess();
  if (!auth.success) return auth;
  const ctx = auth.data;

  try {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (!ticket) {
      return { success: false as const, error: "Ticket not found", details: {} };
    }

    // scope check: same rules as the list
    const allowed = ctx.isSuper
      ? true
      : ticket.instituteId === ctx.instituteId &&
        (ctx.isAdmin ||
          ticket.createdById === ctx.userId ||
          ticket.assignedToId === ctx.userId);

    if (!allowed) {
      return { success: false as const, error: "Not authorized", details: {} };
    }

    const messages = await db
      .select({
        id: supportMessages.id,
        authorRole: supportMessages.authorRole,
        authorName: supportMessages.authorName,
        body: supportMessages.body,
        isInternal: supportMessages.isInternal,
        createdAt: supportMessages.createdAt,
      })
      .from(supportMessages)
      .where(
        // a teacher never sees internal notes
        ctx.isAdmin
          ? eq(supportMessages.ticketId, ticketId)
          : and(
              eq(supportMessages.ticketId, ticketId),
              eq(supportMessages.isInternal, false),
            ),
      )
      .orderBy(asc(supportMessages.createdAt));

    const files = await db
      .select({
        id: supportAttachments.id,
        messageId: supportAttachments.messageId,
        url: supportAttachments.url,
        name: supportAttachments.name,
      })
      .from(supportAttachments)
      .where(eq(supportAttachments.ticketId, ticketId));

    const byMessage = new Map<string, { id: string; url: string; name: string }[]>();
    for (const file of files) {
      if (!file.messageId) continue;
      const list = byMessage.get(file.messageId) ?? [];
      list.push({ id: file.id, url: file.url, name: file.name });
      byMessage.set(file.messageId, list);
    }

    return {
      success: true as const,
      data: {
        ticket: {
          ...ticket,
          overdue:
            ticket.dueAt !== null &&
            ticket.status !== "RESOLVED" &&
            ticket.status !== "CLOSED" &&
            ticket.dueAt.getTime() < Date.now(),
        },
        messages: messages.map((message) => ({
          ...message,
          attachments: byMessage.get(message.id) ?? [],
        })) satisfies TicketMessage[],
        viewer: {
          isAdmin: ctx.isAdmin,
          isSuper: ctx.isSuper,
          userId: ctx.userId,
          role: ctx.role ?? "user",
        },
      },
    };
  } catch (error) {
    console.error("getTicket failed:", error);
    return FAILED;
  }
}

// ---------------------------------------------------------------- reply
export async function replyToTicket(data: unknown) {
  const auth = await requireSupportAccess();
  if (!auth.success) return auth;
  const ctx = auth.data;

  const parsed = replyTicketZod.safeParse(data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    };
  }
  const input = parsed.data;

  const replyAttachments = validateAttachments(input.attachments, ctx.instituteId);
  if (!replyAttachments.ok) {
    return { success: false as const, error: replyAttachments.error, details: {} };
  }

  try {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, input.ticketId))
      .limit(1);

    if (!ticket) {
      return { success: false as const, error: "Ticket not found", details: {} };
    }

    const allowed = ctx.isSuper
      ? true
      : ticket.instituteId === ctx.instituteId &&
        (ctx.isAdmin ||
          ticket.createdById === ctx.userId ||
          ticket.assignedToId === ctx.userId);

    if (!allowed) {
      return { success: false as const, error: "Not authorized", details: {} };
    }

    if (ticket.status === "CLOSED") {
      return {
        success: false as const,
        error: "Reopen the ticket before replying",
        details: {},
      };
    }

    // internal notes are a staff-only tool
    const isInternal = ctx.isAdmin ? input.isInternal : false;
    const author = await authorIdentity(ctx);
    const now = new Date();

    const [message] = await db
      .insert(supportMessages)
      .values({
        ticketId: ticket.id,
        authorId: ctx.userId,
        authorRole: ctx.role ?? "user",
        authorName: author.name,
        body: input.body,
        isInternal,
      })
      .returning({ id: supportMessages.id });

    if (input.attachments.length > 0) {
      await db.insert(supportAttachments).values(
        input.attachments.map((file) => ({
          ticketId: ticket.id,
          messageId: message?.id ?? null,
          url: file.url,
          name: file.name,
          mime: file.mime ?? null,
          size: file.size ?? null,
        })),
      );
    }

    await db
      .update(supportTickets)
      .set({
        lastReplyAt: now,
        firstResponseAt: ticket.firstResponseAt ?? now,
        // a reply from the institute moves an untouched ticket to in progress
        status:
          ticket.status === "OPEN" && ctx.isAdmin ? "IN_PROGRESS" : ticket.status,
        updatedAt: now,
      })
      .where(eq(supportTickets.id, ticket.id));

    if (!isInternal) {
      const recipients = ctx.isAdmin
        ? [ticket.createdById, ticket.assignedToId]
        : ticket.scope === "PLATFORM"
          ? [...(await superAdminIds()), ...(await instituteAdminIds(ticket.instituteId))]
          : [...(await instituteAdminIds(ticket.instituteId)), ticket.assignedToId];

      await notifyUsers({
        userIds: recipients.filter((id) => id !== ctx.userId),
        type: "TICKET_REPLY",
        title: `Reply on: ${ticket.subject}`,
        body: `${author.name}: ${input.body.slice(0, 120)}`,
        href: ticketHref(ticket.id, ticket.scope === "PLATFORM"),
      });
    }

    revalidatePath(`/dashboard/support/${ticket.id}`);
    revalidatePath(`/super-admin/support/${ticket.id}`);
    revalidatePath("/dashboard/support");
    revalidatePath("/super-admin/support");
    return { success: true as const, data: { id: message?.id ?? null } };
  } catch (error) {
    console.error("replyToTicket failed:", error);
    return FAILED;
  }
}

// ---------------------------------------------------------------- status
export async function changeTicketStatus(data: unknown) {
  const auth = await requireSupportAccess();
  if (!auth.success) return auth;
  const ctx = auth.data;

  const parsed = changeStatusZod.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid status", details: {} };
  }
  const { ticketId, status } = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
    // lock the row: two staff members clicking at once used to both pass the
    // JS transition check and both append "Status changed"
    const [ticket] = await tx
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .for("update")
      .limit(1);

    if (!ticket) {
      return { success: false as const, error: "Ticket not found", details: {} };
    }

    const mine = ticket.createdById === ctx.userId;
    const allowed = ctx.isSuper
      ? true
      : ticket.instituteId === ctx.instituteId && (ctx.isAdmin || mine);

    if (!allowed) {
      return { success: false as const, error: "Not authorized", details: {} };
    }

    // a teacher may only reopen their own ticket; everything else is staff work
    if (!ctx.isAdmin) {
      const reopening = ticket.status !== "OPEN" && status === "OPEN";
      if (!mine || !reopening) {
        return {
          success: false as const,
          error: "Only the institute can change this ticket's status",
          details: {},
        };
      }
    }

    if (!TRANSITIONS[ticket.status].includes(status)) {
      return {
        success: false as const,
        error: `A ${ticket.status.toLowerCase().replace("_", " ")} ticket cannot become ${status
          .toLowerCase()
          .replace("_", " ")}`,
        details: {},
      };
    }

    const now = new Date();
    const updated = await tx
      .update(supportTickets)
      .set({
        status,
        resolvedAt: status === "RESOLVED" ? now : status === "OPEN" ? null : ticket.resolvedAt,
        closedAt: status === "CLOSED" ? now : status === "OPEN" ? null : ticket.closedAt,
        // a read-modify-write here lost increments under concurrency
        reopenedCount:
          status === "OPEN" && ticket.status !== "OPEN"
            ? sql`${supportTickets.reopenedCount} + 1`
            : sql`${supportTickets.reopenedCount}`,
        updatedAt: now,
      })
      .where(
        and(
          eq(supportTickets.id, ticketId),
          eq(supportTickets.status, ticket.status),
        ),
      )
      .returning({ id: supportTickets.id });

    if (updated.length === 0) {
      return {
        success: false as const,
        error: "Someone else changed this ticket — reload and try again",
        details: {},
      };
    }

    await db.insert(supportMessages).values({
      ticketId,
      authorId: ctx.userId,
      authorRole: ctx.role ?? "user",
      authorName: "System",
      body: `Status changed from ${ticket.status} to ${status}`,
      isInternal: true,
    });

    await notifyUsers({
      userIds: [
        ticket.createdById,
        ticket.assignedToId,
        ...(ticket.scope === "PLATFORM" ? await superAdminIds() : []),
      ].filter((id) => id !== ctx.userId),
      type: "TICKET_STATUS",
      title: `${ticket.subject} → ${status.replace("_", " ").toLowerCase()}`,
      body: `Status changed by ${ctx.role === "superadmin" ? "the platform team" : "the institute"}`,
      href: ticketHref(ticket.id, ticket.scope === "PLATFORM"),
    });

    return { success: true as const, data: null };
    });

    revalidatePath(`/dashboard/support/${ticketId}`);
    revalidatePath(`/super-admin/support/${ticketId}`);
    revalidatePath("/dashboard/support");
    revalidatePath("/super-admin/support");
    return result;
  } catch (error) {
    console.error("changeTicketStatus failed:", error);
    return FAILED;
  }
}

// ---------------------------------------------------------------- assign
export async function assignTicket(data: unknown) {
  const auth = await requireSupportAccess();
  if (!auth.success) return auth;
  const ctx = auth.data;

  if (!ctx.isAdmin) {
    return { success: false as const, error: "Not authorized", details: {} };
  }

  const parsed = assignTicketZod.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid assignee", details: {} };
  }
  const { ticketId, assigneeId } = parsed.data;

  try {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (!ticket) {
      return { success: false as const, error: "Ticket not found", details: {} };
    }

    if (!ctx.isSuper && ticket.instituteId !== ctx.instituteId) {
      return { success: false as const, error: "Not authorized", details: {} };
    }

    let assigneeName: string | null = null;

    if (assigneeId) {
      // an institute assigns its own staff; the platform can also take a ticket
      const [staff] = ctx.isSuper
        ? await db
            .select({ name: user.name })
            .from(user)
            .where(eq(user.id, assigneeId))
            .limit(1)
        : await db
            .select({ name: teachers.nameEnglish })
            .from(teachers)
            .where(
              and(
                eq(teachers.userId, assigneeId),
                eq(teachers.instituteId, ctx.instituteId),
              ),
            )
            .limit(1);

      if (!staff) {
        return {
          success: false as const,
          error: "That person cannot be assigned this ticket",
          details: {},
        };
      }
      assigneeName = staff.name;
    }

    await db
      .update(supportTickets)
      .set({
        assignedToId: assigneeId,
        assignedToName: assigneeName,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticketId));

    if (assigneeId) {
      await notifyUsers({
        userIds: [assigneeId],
        type: "TICKET_ASSIGNED",
        title: `Assigned to you: ${ticket.subject}`,
        body: `Priority ${ticket.priority.toLowerCase()}`,
        href: ticketHref(ticket.id, ticket.scope === "PLATFORM"),
      });
    }

    revalidatePath(`/dashboard/support/${ticketId}`);
    revalidatePath(`/super-admin/support/${ticketId}`);
    return { success: true as const, data: null };
  } catch (error) {
    console.error("assignTicket failed:", error);
    return FAILED;
  }
}

// ---------------------------------------------------------------- escalate
export async function escalateTicket(ticketId: string) {
  const auth = await requireSupportAccess();
  if (!auth.success) return auth;
  const ctx = auth.data;

  if (!ctx.isAdmin || ctx.isSuper) {
    return {
      success: false as const,
      error: "Only the institute can escalate a ticket",
      details: {},
    };
  }

  try {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (!ticket || ticket.instituteId !== ctx.instituteId) {
      return { success: false as const, error: "Ticket not found", details: {} };
    }
    if (ticket.scope === "PLATFORM") {
      return {
        success: false as const,
        error: "This ticket is already with the platform team",
        details: {},
      };
    }

    await db
      .update(supportTickets)
      .set({ scope: "PLATFORM", updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId));

    await db.insert(supportMessages).values({
      ticketId,
      authorId: ctx.userId,
      authorRole: ctx.role ?? "admin",
      authorName: "System",
      body: "Ticket escalated to the platform team",
      isInternal: true,
    });

    await notifyUsers({
      userIds: [...(await superAdminIds()), ticket.createdById],
      type: "TICKET_ESCALATED",
      title: `Escalated: ${ticket.subject}`,
      body: "The institute asked the platform team to step in",
      href: ticketHref(ticket.id, true),
    });

    revalidatePath(`/dashboard/support/${ticketId}`);
    revalidatePath("/super-admin/support");
    return { success: true as const, data: null };
  } catch (error) {
    console.error("escalateTicket failed:", error);
    return FAILED;
  }
}

// ---------------------------------------------------------------- counters
export async function getSupportCounters() {
  const auth = await requireSupportAccess();
  if (!auth.success) return auth;
  const ctx = auth.data;

  try {
    const scopeWhere = ctx.isSuper
      ? undefined
      : ctx.isAdmin
        ? eq(supportTickets.instituteId, ctx.instituteId)
        : and(
            eq(supportTickets.instituteId, ctx.instituteId),
            or(
              eq(supportTickets.createdById, ctx.userId),
              eq(supportTickets.assignedToId, ctx.userId),
            ),
          );

    const weekAgo = new Date(Date.now() - 7 * 24 * HOUR);

    const [open, overdue, resolvedWeek, mine] = await Promise.all([
      db
        .select({ count: count() })
        .from(supportTickets)
        .where(
          and(scopeWhere, inArray(supportTickets.status, ["OPEN", "IN_PROGRESS"])),
        ),
      db
        .select({ count: count() })
        .from(supportTickets)
        .where(
          and(
            scopeWhere,
            inArray(supportTickets.status, ["OPEN", "IN_PROGRESS"]),
            lte(supportTickets.dueAt, new Date()),
          ),
        ),
      db
        .select({ count: count() })
        .from(supportTickets)
        .where(and(scopeWhere, gte(supportTickets.resolvedAt, weekAgo))),
      db
        .select({ count: count() })
        .from(supportTickets)
        .where(and(scopeWhere, eq(supportTickets.assignedToId, ctx.userId))),
    ]);

    return {
      success: true as const,
      data: {
        open: open[0]?.count ?? 0,
        overdue: overdue[0]?.count ?? 0,
        resolvedWeek: resolvedWeek[0]?.count ?? 0,
        assignedToMe: mine[0]?.count ?? 0,
      },
    };
  } catch (error) {
    console.error("getSupportCounters failed:", error);
    return FAILED;
  }
}

/** People this viewer may assign a ticket to. */
export async function getAssignableStaff() {
  const auth = await requireSupportAccess();
  if (!auth.success) return auth;
  const ctx = auth.data;

  if (!ctx.isAdmin) return { success: true as const, data: [] };

  try {
    if (ctx.isSuper) {
      const rows = await db
        .select({ id: user.id, name: user.name, email: user.email })
        .from(user)
        .where(eq(user.role, "superadmin"))
        .orderBy(asc(user.name));
      return {
        success: true as const,
        data: rows.map((row) => ({ userId: row.id, name: row.name })),
      };
    }

    const rows = await db
      .select({
        userId: teachers.userId,
        name: teachers.nameEnglish,
      })
      .from(teachers)
      .where(
        and(
          eq(teachers.instituteId, ctx.instituteId),
          eq(teachers.status, "ACTIVE"),
        ),
      )
      .orderBy(asc(teachers.nameEnglish));

    return {
      success: true as const,
      data: rows
        .filter((row): row is { userId: string; name: string } => Boolean(row.userId))
        .map((row) => ({ userId: row.userId, name: row.name })),
    };
  } catch (error) {
    console.error("getAssignableStaff failed:", error);
    return FAILED;
  }
}

/** Institutes a superadmin can filter by. */
export async function getInstituteOptions() {
  const auth = await requireSupportAccess();
  if (!auth.success) return auth;
  if (!auth.data.isSuper) return { success: true as const, data: [] };

  try {
    const rows = await db
      .select({ id: instituteProfile.id, name: instituteProfile.nameEnglish })
      .from(instituteProfile)
      .orderBy(asc(instituteProfile.nameEnglish));
    return { success: true as const, data: rows };
  } catch (error) {
    console.error("getInstituteOptions failed:", error);
    return FAILED;
  }
}
