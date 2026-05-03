/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * PRD §9.2 熱度公式：瀏覽 × 0.5 + 留言 × 2
 * V1.1 進階：加上時間衰減（7 天 0.5x）+ 點讚 × 1
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const blogs = await db.blog.findMany({
    where: { status: "PUBLISHED", isPublic: true },
    select: { id: true, viewCount: true, likeCount: true, createdAt: true,
              _count: { select: { comments: true } } },
  });
  let updated = 0;
  for (const b of blogs) {
    const ageDays = Math.max(0, (now - b.createdAt.getTime()) / 86400000);
    const decay = Math.pow(0.5, ageDays / 7);
    const score = (b.viewCount * 0.5 + (b._count.comments ?? 0) * 2 + b.likeCount * 1) * decay;
    await db.blog.update({
      where: { id: b.id },
      data: { hotScore: Math.round(score * 100) / 100 },
    });
    updated++;
  }
  return NextResponse.json({ ok: true, updated, scannedAt: new Date().toISOString() });
}
