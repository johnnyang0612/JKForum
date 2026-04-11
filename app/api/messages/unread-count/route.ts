import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "未登入" },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // 找到所有參與的對話
  const participants = await db.conversationParticipant.findMany({
    where: { userId },
    select: {
      conversationId: true,
      lastReadAt: true,
    },
  });

  // 計算每個對話的未讀數
  let totalUnread = 0;
  for (const p of participants) {
    const count = await db.message.count({
      where: {
        conversationId: p.conversationId,
        senderId: { not: userId },
        createdAt: { gt: p.lastReadAt },
        isDeleted: false,
      },
    });
    totalUnread += count;
  }

  return NextResponse.json({
    success: true,
    data: { unreadCount: totalUnread },
  });
}
