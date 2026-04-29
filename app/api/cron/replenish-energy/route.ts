import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 每日 00:00 體力恢復到 100（VIP 上限 200）
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET) {
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // 一般會員恢復到 100
  const a = await db.userPoints.updateMany({
    where: { energy: { lt: 100 }, user: { userGroup: { not: "VIP" } } },
    data: { energy: 100 },
  });
  // VIP 恢復到 200
  const b = await db.userPoints.updateMany({
    where: { energy: { lt: 200 }, user: { userGroup: "VIP" } },
    data: { energy: 200 },
  });

  return NextResponse.json({
    ok: true,
    refilled: { regular: a.count, vip: b.count },
  });
}
