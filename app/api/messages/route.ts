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

  const conversations = await db.conversation.findMany({
    where: {
      participants: { some: { userId } },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profile: { select: { avatarUrl: true } },
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          senderId: true,
          isDeleted: true,
          createdAt: true,
        },
      },
    },
  });

  const result = await Promise.all(
    conversations.map(async (conv) => {
      const myParticipant = conv.participants.find(
        (p) => p.userId === userId
      );
      const otherParticipant = conv.participants.find(
        (p) => p.userId !== userId
      );
      const lastMessage = conv.messages[0] || null;

      const unreadCount = myParticipant
        ? await db.message.count({
            where: {
              conversationId: conv.id,
              senderId: { not: userId },
              createdAt: { gt: myParticipant.lastReadAt },
              isDeleted: false,
            },
          })
        : 0;

      return {
        id: conv.id,
        updatedAt: conv.updatedAt,
        otherUser: otherParticipant
          ? {
              id: otherParticipant.user.id,
              username: otherParticipant.user.username,
              displayName: otherParticipant.user.displayName,
              avatarUrl:
                otherParticipant.user.profile?.avatarUrl || null,
            }
          : null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.isDeleted
                ? "（訊息已刪除）"
                : lastMessage.content,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount,
      };
    })
  );

  return NextResponse.json({ success: true, data: result });
}
