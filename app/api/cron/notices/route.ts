import { NextResponse } from "next/server";

import { sweepNotices } from "@/app/super-admin/(main)/notices/_lib/notice.internal";

/**
 * Publish anything due and archive anything expired.
 *
 * The lists sweep lazily on render, so this exists for a real scheduler: call it
 * every few minutes with `Authorization: Bearer $CRON_SECRET`. Without a secret
 * configured it stays closed, so a stray request cannot trigger notifications.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");

  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const result = await sweepNotices();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    published: result.data.published,
    at: new Date().toISOString(),
  });
}
