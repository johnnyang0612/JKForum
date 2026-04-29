import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 排程發文：每 5 分鐘掃 DRAFT 且 scheduledAt <= now，改 PUBLISHED
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET) {
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const due = await db.post.findMany({
    where: { status: "DRAFT", scheduledAt: { lte: now, not: null } },
    select: { id: true, authorId: true, forumId: true },
  });

  let published = 0;
  for (const p of due) {
    await db.post.update({ where: { id: p.id }, data: { status: "PUBLISHED" } });
    await db.forum.update({
      where: { id: p.forumId },
      data: { postCount: { increment: 1 }, todayPostCount: { increment: 1 } },
    });
    const { earnPointsSafe } = await import("@/lib/points-engine");
    await earnPointsSafe({
      userId: p.authorId,
      action: "post_create",
      relatedId: p.id,
      relatedType: "post",
      forumId: p.forumId,
    });
    published++;
  }

  return NextResponse.json({ ok: true, published, scannedAt: now.toISOString() });
}
