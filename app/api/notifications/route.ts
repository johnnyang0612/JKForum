import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { parsePaginationParams } from "@/lib/utils/pagination";
import { createPaginationMeta } from "@/types/api";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const countOnly = searchParams.get("countOnly");

  if (countOnly) {
    const unreadCount = await db.notification.count({
      where: { recipientId: session.user.id, isRead: false },
    });
    return NextResponse.json({ success: true, data: { unreadCount } });
  }

  const { page, limit } = parsePaginationParams({
    page: searchParams.get("page") || undefined,
    limit: searchParams.get("pageSize") || "20",
  });
  const unreadOnly = searchParams.get("filter") === "unread";

  const where = {
    recipientId: session.user.id,
    ...(unreadOnly ? { isRead: false } : {}),
  };

  const [notifications, total] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.notification.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: notifications,
    meta: createPaginationMeta(total, page, limit),
  });
}
