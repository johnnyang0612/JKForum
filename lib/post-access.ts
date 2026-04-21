import { db } from "./db";

export type AccessReason =
  | "ok"
  | "login_required"
  | "not_replied"          // hidden-until-reply
  | "not_unlocked"         // paid post
  | "vip_required"
  | "permission_too_low"
  | "private";

export interface AccessResult {
  allowed: boolean;
  reason: AccessReason;
  lockedContent: boolean;   // true = hide full content, show gate UI
  requiredCoins?: number;
  requiredPermission?: number;
  currentPermission?: number;
}

/**
 * Determine if user can view the full content of a post.
 * Author always passes.
 */
export async function checkPostAccess(
  post: {
    id: string;
    authorId: string;
    visibility: string;
    paidCoins: number;
    minReadPermission: number;
  },
  viewerId?: string | null
): Promise<AccessResult> {
  // Author bypass
  if (viewerId && viewerId === post.authorId) {
    return { allowed: true, reason: "ok", lockedContent: false };
  }

  // PRIVATE: author only
  if (post.visibility === "PRIVATE") {
    return {
      allowed: false,
      reason: "private",
      lockedContent: true,
    };
  }

  // Read permission check (applies to all non-PUBLIC too)
  if (post.minReadPermission > 0) {
    if (!viewerId) {
      return {
        allowed: false,
        reason: "login_required",
        lockedContent: true,
        requiredPermission: post.minReadPermission,
      };
    }
    // Check user's reading permission (mapped from level — higher level = higher permission)
    const userPts = await db.userPoints.findUnique({
      where: { userId: viewerId },
      select: { level: true },
    });
    const userPermission = levelToPermission(userPts?.level ?? 16);
    if (userPermission < post.minReadPermission) {
      return {
        allowed: false,
        reason: "permission_too_low",
        lockedContent: true,
        requiredPermission: post.minReadPermission,
        currentPermission: userPermission,
      };
    }
  }

  // REPLY_TO_VIEW: check if viewer replied
  if (post.visibility === "REPLY_TO_VIEW") {
    if (!viewerId) {
      return { allowed: false, reason: "login_required", lockedContent: true };
    }
    const replied = await db.reply.findFirst({
      where: { postId: post.id, authorId: viewerId },
      select: { id: true },
    });
    if (!replied) {
      return { allowed: false, reason: "not_replied", lockedContent: true };
    }
  }

  // VIP_ONLY: check active VIP subscription
  if (post.visibility === "VIP_ONLY") {
    if (!viewerId) {
      return { allowed: false, reason: "login_required", lockedContent: true };
    }
    const vip = await db.vipSubscription.findFirst({
      where: {
        userId: viewerId,
        status: "ACTIVE",
        endDate: { gt: new Date() },
      },
      select: { id: true },
    });
    if (!vip) {
      return { allowed: false, reason: "vip_required", lockedContent: true };
    }
  }

  // PAID: check unlock
  if (post.visibility === "PAID" && post.paidCoins > 0) {
    if (!viewerId) {
      return {
        allowed: false,
        reason: "login_required",
        lockedContent: true,
        requiredCoins: post.paidCoins,
      };
    }
    const unlock = await db.postUnlock.findUnique({
      where: { userId_postId: { userId: viewerId, postId: post.id } },
      select: { userId: true },
    });
    if (!unlock) {
      return {
        allowed: false,
        reason: "not_unlocked",
        lockedContent: true,
        requiredCoins: post.paidCoins,
      };
    }
  }

  return { allowed: true, reason: "ok", lockedContent: false };
}

/**
 * Map 18-tier level (0=皇帝 to 17=奴隸) to read permission value.
 * Matches JKF: 平民=10, 鄉紳=20, ..., 皇帝=200
 */
export function levelToPermission(level: number): number {
  // 0=皇帝, 16=平民, 17=奴隸
  const map: Record<number, number> = {
    0: 200,  1: 180,  2: 160,  3: 140,  4: 130,
    5: 120,  6: 110,  7: 100,  8:  90,  9:  80,
    10: 70, 11: 60,  12: 50,  13: 40,  14: 30,
    15: 20, 16: 10,  17:  0,
  };
  return map[level] ?? 10;
}
