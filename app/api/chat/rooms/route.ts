import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat/rooms
 * 列出所有 active 聊天室 + 各室最後訊息預覽 + 該用戶未讀計數（若已登入）。
 */
export async function GET() {
  const rooms = await db.chatRoom.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const session = await getServerSession(authOptions);

  // 每室抓最後一則 + 未讀計數
  const enriched = await Promise.all(
    rooms.map(async (r) => {
      const lastMessage = await db.chatMessage.findFirst({
        where: { roomId: r.id, isDeleted: false },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          messageType: true,
          createdAt: true,
          sender: {
            select: { displayName: true, username: true },
          },
        },
      });

      const todayCount = await db.chatMessage.count({
        where: {
          roomId: r.id,
          isDeleted: false,
          createdAt: { gt: new Date(Date.now() - 86400000) },
        },
      });

      let unreadCount = 0;
      if (session?.user) {
        const read = await db.chatRoomRead.findUnique({
          where: {
            userId_roomId: { userId: session.user.id, roomId: r.id },
          },
          select: { lastReadAt: true },
        });
        const since = read?.lastReadAt ?? new Date(0);
        unreadCount = await db.chatMessage.count({
          where: {
            roomId: r.id,
            isDeleted: false,
            senderId: { not: session.user.id },
            createdAt: { gt: since },
          },
        });
      }

      return { ...r, lastMessage, todayCount, unreadCount };
    })
  );

  return NextResponse.json({ success: true, rooms: enriched });
}
