import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// 與 /read-all 同義；命名更清楚
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const result = await db.notification.updateMany({
    where: { recipientId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true, updated: result.count });
}
