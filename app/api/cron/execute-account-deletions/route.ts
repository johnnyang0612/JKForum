import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 帳號刪除 cron：每天執行
 * 找出 30 天冷靜期已到、且未取消的請求 → 真正刪除使用者
 * （Cascade delete 會處理關聯的 posts/replies/messages 等）
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET) {
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const due = await db.accountDeletionRequest.findMany({
    where: {
      scheduledAt: { lte: now },
      cancelledAt: null,
      executedAt: null,
    },
    take: 100, // 安全上限
  });

  let executed = 0;
  let failed = 0;
  for (const req of due) {
    try {
      // 標記為 executed 後刪除使用者（cascade）
      await db.$transaction([
        db.accountDeletionRequest.update({
          where: { id: req.id },
          data: { executedAt: now },
        }),
        db.user.delete({ where: { id: req.userId } }),
      ]);
      executed++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ ok: true, executed, failed, scannedAt: now.toISOString() });
}
