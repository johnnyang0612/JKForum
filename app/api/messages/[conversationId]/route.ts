import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const MESSAGES_PER_PAGE = 30;

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "未登入" },
      { status: 401 }
    );
  }

  const { conversationId } = params;

  // 確認用戶是對話的參與者
  const participant = await db.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: session.user.id,
      },
    },
  });

  if (!participant) {
    return NextResponse.json(
      { success: false, error: "無權存取此對話" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const skip = (page - 1) * MESSAGES_PER_PAGE;

  const [messages, total] = await Promise.all([
    db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      skip,
      take: MESSAGES_PER_PAGE,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    }),
    db.message.count({ where: { conversationId } }),
  ]);

  return NextResponse.json({
    success: true,
    data: messages.reverse(),
    meta: {
      total,
      page,
      pageSize: MESSAGES_PER_PAGE,
      totalPages: Math.ceil(total / MESSAGES_PER_PAGE),
      hasMore: page * MESSAGES_PER_PAGE < total,
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "未登入" },
      { status: 401 }
    );
  }

  const { conversationId } = params;
  const body = await req.json();
  const content = body.content?.trim();

  if (!content) {
    return NextResponse.json(
      { success: false, error: "訊息內容不能為空" },
      { status: 400 }
    );
  }

  if (content.length > 5000) {
    return NextResponse.json(
      { success: false, error: "訊息內容不能超過 5000 字" },
      { status: 400 }
    );
  }

  // 確認用戶是對話的參與者
  const participant = await db.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: session.user.id,
      },
    },
  });

  if (!participant) {
    return NextResponse.json(
      { success: false, error: "無權存取此對話" },
      { status: 403 }
    );
  }

  // 檢查封鎖狀態
  const otherParticipant = await db.conversationParticipant.findFirst({
    where: {
      conversationId,
      userId: { not: session.user.id },
    },
    select: { userId: true },
  });

  if (otherParticipant) {
    const block = await db.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: session.user.id, blockedId: otherParticipant.userId },
          { blockerId: otherParticipant.userId, blockedId: session.user.id },
        ],
      },
    });

    if (block) {
      return NextResponse.json(
        { success: false, error: "無法傳送訊息給此用戶" },
        { status: 403 }
      );
    }
  }

  const [message] = await db.$transaction([
    db.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    }),
    db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
    db.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
      data: { lastReadAt: new Date() },
    }),
  ]);

  return NextResponse.json({ success: true, data: message });
}
