import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";

/**
 * 建立通知
 */
export async function createNotification({
  recipientId,
  type,
  title,
  content,
  linkUrl,
  senderId,
  relatedId,
}: {
  recipientId: string;
  type: NotificationType;
  title: string;
  content?: string;
  linkUrl?: string;
  senderId?: string;
  relatedId?: string;
}) {
  // 不要發通知給自己
  if (senderId && senderId === recipientId) {
    return null;
  }

  // 檢查接收者是否封鎖了發送者
  if (senderId) {
    const isBlocked = await db.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: recipientId,
          blockedId: senderId,
        },
      },
    });

    if (isBlocked) {
      return null;
    }
  }

  return db.notification.create({
    data: {
      recipientId,
      type,
      title,
      content,
      linkUrl,
      senderId,
      relatedId,
    },
  });
}

/**
 * 標記單則通知為已讀
 */
export async function markAsRead(notificationId: string, userId: string) {
  return db.notification.updateMany({
    where: {
      id: notificationId,
      recipientId: userId,
    },
    data: {
      isRead: true,
    },
  });
}

/**
 * 標記所有通知為已讀
 */
export async function markAllAsRead(userId: string) {
  return db.notification.updateMany({
    where: {
      recipientId: userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
}

/**
 * 取得未讀通知數量
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({
    where: {
      recipientId: userId,
      isRead: false,
    },
  });
}

/**
 * 取得通知列表（分頁）
 */
export async function getNotifications(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  } = {}
) {
  const { page = 1, limit = 20, unreadOnly = false } = options;
  const skip = (page - 1) * limit;

  const where = {
    recipientId: userId,
    ...(unreadOnly ? { isRead: false } : {}),
  };

  const [notifications, total] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.notification.count({ where }),
  ]);

  return {
    notifications,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasMore: skip + notifications.length < total,
  };
}

/**
 * 發送回覆通知
 */
export async function notifyReply(
  postAuthorId: string,
  replyAuthorId: string,
  replyAuthorName: string,
  postTitle: string,
  postId: string
) {
  return createNotification({
    recipientId: postAuthorId,
    type: "REPLY",
    title: `${replyAuthorName} 回覆了你的文章`,
    content: `在「${postTitle}」中發表了回覆`,
    linkUrl: `/posts/${postId}`,
    senderId: replyAuthorId,
    relatedId: postId,
  });
}

/**
 * 發送按讚通知
 */
export async function notifyLike(
  contentAuthorId: string,
  likerUserId: string,
  likerName: string,
  contentTitle: string,
  linkUrl: string
) {
  return createNotification({
    recipientId: contentAuthorId,
    type: "LIKE",
    title: `${likerName} 讚了你的內容`,
    content: contentTitle,
    linkUrl,
    senderId: likerUserId,
  });
}

/**
 * 發送追蹤通知
 */
export async function notifyFollow(
  followedUserId: string,
  followerUserId: string,
  followerName: string
) {
  return createNotification({
    recipientId: followedUserId,
    type: "FOLLOW",
    title: `${followerName} 追蹤了你`,
    content: "你有了新的追蹤者！",
    linkUrl: `/profile/${followerUserId}`,
    senderId: followerUserId,
  });
}

/**
 * 發送系統通知
 */
export async function notifySystem(
  recipientId: string,
  title: string,
  content: string,
  linkUrl?: string
) {
  return createNotification({
    recipientId,
    type: "SYSTEM",
    title,
    content,
    linkUrl,
  });
}
