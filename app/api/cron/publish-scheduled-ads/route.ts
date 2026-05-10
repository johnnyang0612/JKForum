import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 排程上架業者廣告：
 * 每 5 分鐘掃 DRAFT/SCHEDULED 且 scheduledAt <= now 的廣告，改成 PENDING（送審）。
 * 通過審核後 admin 會把 status 改 ACTIVE。
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET) {
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const due = await db.businessAd.findMany({
    where: {
      status: "DRAFT",
      scheduledAt: { lte: now, not: null },
    },
    select: { id: true, merchantId: true, title: true },
  });

  let submitted = 0;
  for (const ad of due) {
    await db.businessAd.update({
      where: { id: ad.id },
      data: { status: "PENDING", scheduledAt: null }, // 送審完成、清排程時間
    });
    submitted++;
  }

  return NextResponse.json({ ok: true, submitted, scannedAt: now.toISOString() });
}
