import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";

/**
 * 通知偏好（存於 UserProfile.notificationPrefs JSON）。
 * 預設：站內全開；email 預設關（避免騷擾）；line/push 渠道亦預設關。
 */
type NotificationChannel = "site" | "email" | "line" | "push";
type NotificationPrefs = Partial<Record<NotificationType, Partial<Record<NotificationChannel, boolean>>>>;

const DEFAULT_SITE: Record<NotificationType, boolean> = {
  REPLY: true,
  LIKE: true,
  FOLLOW: true,
  MENTION: true,
  SYSTEM: true,
  REPORT_RESULT: true,
  LEVEL_UP: true,
  ACHIEVEMENT: true,
};

function shouldDeliver(
  prefs: NotificationPrefs | null | undefined,
  type: NotificationType,
  channel: NotificationChannel
): boolean {
  const perType = prefs?.[type];
  if (perType && channel in perType) {
    return perType[channel] === true;
  }
  // fallback
  if (channel === "site") return DEFAULT_SITE[type] ?? true;
  return false; // email/line/push 預設關，使用者必須主動開
}

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

  // 檢查使用者通知偏好
  const profile = await db.userProfile.findUnique({
    where: { userId: recipientId },
    select: { notificationPrefs: true },
  });
  const prefs = (profile?.notificationPrefs ?? null) as NotificationPrefs | null;

  if (!shouldDeliver(prefs, type, "site")) {
    // 使用者已關閉此類型站內通知
    return null;
  }

  const noti = await db.notification.create({
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

  // 外部渠道（email / line / push）— 框架已備，待客戶提供 API key 後接通
  // 目前用 fire-and-forget 留 hook
  if (shouldDeliver(prefs, type, "email")) {
    queueExternalNotification({ recipientId, type, title, content, linkUrl, channel: "email" });
  }
  if (shouldDeliver(prefs, type, "line")) {
    queueExternalNotification({ recipientId, type, title, content, linkUrl, channel: "line" });
  }
  if (shouldDeliver(prefs, type, "push")) {
    queueExternalNotification({ recipientId, type, title, content, linkUrl, channel: "push" });
  }

  return noti;
}

/**
 * 外部渠道通知 hook — 待 Resend / LINE Notify / Web Push 接通
 * 目前 no-op，待 ENV 設好後再實作 transport。
 */
function queueExternalNotification(payload: {
  recipientId: string;
  type: NotificationType;
  title: string;
  content?: string;
  linkUrl?: string;
  channel: "email" | "line" | "push";
}) {
  // 預留：把待送通知寫到 outbox 表或直接呼 Resend/LINE API
  // 用 console.log 取代未來會做的事，方便 ops 確認規則被觸發
  if (process.env.NODE_ENV === "development") {
    console.log("[notification:external]", payload.channel, payload.type, "→", payload.recipientId);
  }
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
