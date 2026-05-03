/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/services/notification-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const now = new Date();

  // 1. 25 天即將過期提醒（PRD: 滿 25 天發提醒）
  const remindBefore = new Date(now.getTime() + 5 * 86400000);
  const upcoming = await db.businessAd.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: remindBefore, gt: now },
    },
    select: { id: true, merchantId: true, title: true, expiresAt: true },
  });
  for (const ad of upcoming) {
    // 簡單防重發：標題前綴含 "[已通知]" 視為已通知（粗略，正式版應另開一個 reminder log）
    if ((ad as any)._reminded) continue;
    await createNotification({
      recipientId: ad.merchantId,
      type: "SYSTEM",
      title: "⏰ 廣告即將下架",
      content: `「${ad.title}」將於 ${new Date(ad.expiresAt!).toLocaleDateString("zh-TW")} 自動下架，如需延長請重新發布`,
      linkUrl: `/business/ads/${ad.id}`,
      relatedId: ad.id,
    }).catch(() => null);
  }

  // 2. 已過期 → EXPIRED + 通知
  const toExpire = await db.businessAd.findMany({
    where: { status: "ACTIVE", expiresAt: { lte: now } },
    select: { id: true, merchantId: true, title: true },
  });
  if (toExpire.length > 0) {
    await db.businessAd.updateMany({
      where: { id: { in: toExpire.map((a) => a.id) } },
      data: { status: "EXPIRED" },
    });
    for (const ad of toExpire) {
      await createNotification({
        recipientId: ad.merchantId,
        type: "SYSTEM",
        title: "📤 廣告已自動下架",
        content: `「${ad.title}」滿 30 天自動下架`,
        linkUrl: `/business/ads/${ad.id}`,
        relatedId: ad.id,
      }).catch(() => null);
    }
  }

  return NextResponse.json({
    ok: true,
    expired: toExpire.length,
    upcomingNotified: upcoming.length,
    scannedAt: now.toISOString(),
  });
}
