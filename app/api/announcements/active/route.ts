import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// 公開 API：給前台 banner 用
export async function GET() {
  const now = new Date();
  const list = await db.announcement.findMany({
    where: {
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 5,
  });

  return NextResponse.json({
    announcements: list.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      severity: a.severity,
      isPinned: a.isPinned,
    })),
  });
}
