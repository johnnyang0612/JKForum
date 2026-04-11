"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

const MESSAGES_PER_PAGE = 30;

/**
 * 尋找或建立與某用戶的 1-on-1 對話
 */
export async function getOrCreateConversation(targetUserId: string) {
  const user = await requireAuth();

  if (user.id === targetUserId) {
    return { error: "不能與自己對話" };
  }

  // 檢查目標用戶是否存在且有效
  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, status: true },
  });

  if (!targetUser || targetUser.status === "DELETED" || targetUser.status === "BANNED") {
    return { error: "找不到此用戶" };
  }

  // 檢查封鎖狀態（雙向）
  const block = await db.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: user.id, blockedId: targetUserId },
        { blockerId: targetUserId, blockedId: user.id },
      ],
    },
  });

  if (block) {
    return { error: "無法與此用戶對話" };
  }

  // 尋找既有的 1-on-1 對話
  const existingConversation = await db.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: user.id } } },
        { participants: { some: { userId: targetUserId } } },
      ],
      participants: { every: { userId: { in: [user.id, targetUserId] } } },
    },
    select: { id: true },
  });

  if (existingConversation) {
    return { success: true, conversationId: existingConversation.id };
  }

  // 建立新對話
  const conversation = await db.conversation.create({
    data: {
      participants: {
        createMany: {
          data: [
            { userId: user.id },
            { userId: targetUserId },
          ],
        },
      },
    },
  });

  revalidatePath("/messages");
  return { success: true, conversationId: conversation.id };
}

/**
 * 發送訊息
 */
export async function sendMessage(conversationId: string, content: string) {
  const user = await requireAuth();

  if (!content.trim()) {
    return { error: "訊息內容不能為空" };
  }

  if (content.length > 5000) {
    return { error: "訊息內容不能超過 5000 字" };
  }

  // 確認用戶是對話的參與者
  const participant = await db.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: user.id,
      },
    },
  });

  if (!participant) {
    return { error: "你不是此對話的成員" };
  }

  // 取得對方用戶，檢查封鎖狀態
  const otherParticipant = await db.conversationParticipant.findFirst({
    where: {
      conversationId,
      userId: { not: user.id },
    },
    select: { userId: true },
  });

  if (otherParticipant) {
    const block = await db.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: otherParticipant.userId },
          { blockerId: otherParticipant.userId, blockedId: user.id },
        ],
      },
    });

    if (block) {
      return { error: "無法傳送訊息給此用戶" };
    }
  }

  // 建立訊息並更新對話時間
  const [message] = await db.$transaction([
    db.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: content.trim(),
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
    // 同時更新自己的已讀時間
    db.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
      data: { lastReadAt: new Date() },
    }),
  ]);

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);

  return { success: true, message };
}

/**
 * 取得當前用戶的所有對話列表
 */
export async function getConversations() {
  const user = await requireAuth();

  const conversations = await db.conversation.findMany({
    where: {
      participants: { some: { userId: user.id } },
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

  // 計算未讀數量並格式化
  const result = await Promise.all(
    conversations.map(async (conv) => {
      const myParticipant = conv.participants.find((p) => p.userId === user.id);
      const otherParticipant = conv.participants.find((p) => p.userId !== user.id);
      const lastMessage = conv.messages[0] || null;

      const unreadCount = myParticipant
        ? await db.message.count({
            where: {
              conversationId: conv.id,
              senderId: { not: user.id },
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
              avatarUrl: otherParticipant.user.profile?.avatarUrl || null,
            }
          : null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.isDeleted ? "（訊息已刪除）" : lastMessage.content,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount,
      };
    })
  );

  return { success: true, data: result };
}

/**
 * 取得某對話的訊息（分頁）
 */
export async function getMessages(conversationId: string, page: number = 1) {
  const user = await requireAuth();

  // 確認用戶是對話的參與者
  const participant = await db.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: user.id,
      },
    },
  });

  if (!participant) {
    return { error: "你不是此對話的成員" };
  }

  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * MESSAGES_PER_PAGE;

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

  return {
    success: true,
    data: messages.reverse(), // 按時間正序回傳
    meta: {
      total,
      page: safePage,
      pageSize: MESSAGES_PER_PAGE,
      totalPages: Math.ceil(total / MESSAGES_PER_PAGE),
      hasMore: safePage * MESSAGES_PER_PAGE < total,
    },
  };
}

/**
 * 標記對話已讀
 */
export async function markAsRead(conversationId: string) {
  const user = await requireAuth();

  try {
    await db.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
      data: { lastReadAt: new Date() },
    });

    revalidatePath("/messages");
    return { success: true };
  } catch {
    return { error: "操作失敗" };
  }
}

/**
 * 刪除訊息（軟刪除）
 */
export async function deleteMessage(messageId: string) {
  const user = await requireAuth();

  const message = await db.message.findUnique({
    where: { id: messageId },
    select: { id: true, senderId: true, conversationId: true },
  });

  if (!message) {
    return { error: "訊息不存在" };
  }

  if (message.senderId !== user.id) {
    return { error: "只能刪除自己的訊息" };
  }

  await db.message.update({
    where: { id: messageId },
    data: { isDeleted: true },
  });

  revalidatePath(`/messages/${message.conversationId}`);
  return { success: true };
}

/**
 * 搜尋用戶（用於新對話）
 */
export async function searchUsersForMessage(query: string) {
  const user = await requireAuth();

  if (!query.trim() || query.length < 2) {
    return { success: true, data: [] };
  }

  // 取得被我封鎖 / 封鎖我的用戶 ID
  const blocks = await db.userBlock.findMany({
    where: {
      OR: [
        { blockerId: user.id },
        { blockedId: user.id },
      ],
    },
    select: { blockerId: true, blockedId: true },
  });

  const blockedIds = new Set<string>();
  blocks.forEach((b) => {
    blockedIds.add(b.blockerId);
    blockedIds.add(b.blockedId);
  });
  blockedIds.delete(user.id);

  const users = await db.user.findMany({
    where: {
      id: { notIn: [user.id, ...Array.from(blockedIds)] },
      status: { in: ["ACTIVE", "MUTED"] },
      OR: [
        { username: { contains: query, mode: "insensitive" } },
        { displayName: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      profile: { select: { avatarUrl: true } },
    },
    take: 10,
  });

  return { success: true, data: users };
}
