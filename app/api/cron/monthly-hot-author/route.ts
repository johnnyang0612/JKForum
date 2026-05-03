/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/services/notification-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 每月 1 號跑：算上個月 blog 熱度 top3 作者，授予「月度熱門作者」勳章 + 通知
 * 簡化：用既有 medals 系統的 representativeMedalSlug 欄位（無新表）
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthLabel = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;

  // 取上月發布的 blog，按作者聚合 hotScore
  const blogs = await db.blog.findMany({
    where: {
      status: "PUBLISHED", isPublic: true,
      createdAt: { gte: monthStart, lt: monthEnd },
    },
    select: { authorId: true, hotScore: true },
  });

  const byAuthor: Record<string, number> = {};
  for (const b of blogs) byAuthor[b.authorId] = (byAuthor[b.authorId] ?? 0) + b.hotScore;
  const top3 = Object.entries(byAuthor)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id, score]) => ({ id, score }));

  for (let i = 0; i < top3.length; i++) {
    const { id, score } = top3[i];
    await createNotification({
      recipientId: id,
      type: "ACHIEVEMENT",
      title: `🏆 ${monthLabel} 月度熱門作者 第 ${i + 1} 名`,
      content: `恭喜！您的日誌熱度總分 ${Math.round(score)}，獲得「月度熱門作者」榮譽`,
      linkUrl: "/profile",
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, month: monthLabel, top3 });
}
