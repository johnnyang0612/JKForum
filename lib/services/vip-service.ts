import { db } from "@/lib/db";
import { VipPlan, VipStatus, PointType, PointChangeReason } from "@prisma/client";

/**
 * VIP 方案定義
 */
export const VIP_PLANS = {
  MONTHLY: {
    plan: "MONTHLY" as VipPlan,
    name: "月費會員",
    price: 99,          // 白金幣
    duration: 30,       // 天
    description: "適合想先體驗 VIP 的你",
    benefits: [
      "專屬 VIP 標識",
      "觀看 VIP 限定內容",
      "每日簽到雙倍金幣",
      "專屬勳章展示",
    ],
  },
  QUARTERLY: {
    plan: "QUARTERLY" as VipPlan,
    name: "季費會員",
    price: 249,
    duration: 90,
    description: "最多人選擇的方案",
    benefits: [
      "月費所有權益",
      "每月贈送置頂卡 x1",
      "暱稱專屬顏色",
      "優先客服回覆",
    ],
    tag: "最受歡迎",
  },
  YEARLY: {
    plan: "YEARLY" as VipPlan,
    name: "年費會員",
    price: 799,
    duration: 365,
    description: "最划算的長期方案",
    benefits: [
      "季費所有權益",
      "每月贈送高亮卡 x2",
      "專屬年費勳章",
      "免費進入付費看板",
    ],
    tag: "最划算",
  },
} as const;

export type VipPlanKey = keyof typeof VIP_PLANS;

/**
 * 檢查用戶是否為有效 VIP
 */
export async function checkVipStatus(userId: string) {
  const subscription = await db.vipSubscription.findFirst({
    where: {
      userId,
      status: VipStatus.ACTIVE,
      endDate: { gt: new Date() },
    },
    orderBy: { endDate: "desc" },
  });

  return {
    isVip: !!subscription,
    subscription,
    plan: subscription ? VIP_PLANS[subscription.plan as VipPlanKey] : null,
  };
}

/**
 * 取得 VIP 方案的權益
 */
export function getVipBenefits(plan: VipPlan) {
  return VIP_PLANS[plan as VipPlanKey];
}

/**
 * 購買 VIP 方案
 */
export async function purchaseVip(userId: string, planKey: VipPlanKey) {
  const planInfo = VIP_PLANS[planKey];

  // 查詢用戶積分
  const userPoints = await db.userPoints.findUnique({
    where: { userId },
  });

  if (!userPoints) {
    return { error: "找不到用戶積分資料" };
  }

  if (userPoints.platinum < planInfo.price) {
    return { error: `白金幣不足，需要 ${planInfo.price} 白金幣，目前只有 ${userPoints.platinum} 白金幣` };
  }

  // 檢查是否已有有效訂閱
  const existingVip = await db.vipSubscription.findFirst({
    where: {
      userId,
      status: VipStatus.ACTIVE,
      endDate: { gt: new Date() },
    },
  });

  const startDate = existingVip ? existingVip.endDate : new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + planInfo.duration);

  // 執行交易：扣款 + 建立訂閱
  const [subscription] = await db.$transaction([
    db.vipSubscription.create({
      data: {
        userId,
        plan: planInfo.plan,
        startDate,
        endDate,
        status: VipStatus.ACTIVE,
      },
    }),
    db.userPoints.update({
      where: { userId },
      data: {
        platinum: { decrement: planInfo.price },
      },
    }),
    db.pointHistory.create({
      data: {
        userId,
        type: PointType.PLATINUM,
        amount: -planInfo.price,
        reason: PointChangeReason.VIP_BONUS,
        detail: `購買 VIP ${planInfo.name}`,
      },
    }),
  ]);

  return { success: true, subscription };
}

/**
 * 取消 VIP 訂閱
 */
export async function cancelVip(subscriptionId: string, userId: string) {
  const subscription = await db.vipSubscription.findFirst({
    where: { id: subscriptionId, userId, status: VipStatus.ACTIVE },
  });

  if (!subscription) {
    return { error: "找不到有效的 VIP 訂閱" };
  }

  await db.vipSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: VipStatus.CANCELLED,
      autoRenew: false,
    },
  });

  return { success: true, message: "VIP 已取消，權益將持續到到期日" };
}

/**
 * 檢查用戶是否有權觀看 VIP 內容
 */
export async function isVipContent(userId: string | null, visibility: string) {
  if (visibility !== "VIP_ONLY") {
    return true;
  }

  if (!userId) {
    return false;
  }

  const { isVip } = await checkVipStatus(userId);
  return isVip;
}

/**
 * 取得用戶的所有 VIP 訂閱記錄
 */
export async function getVipHistory(userId: string) {
  return db.vipSubscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * 過期 VIP 批次處理（由排程呼叫）
 */
export async function expireVipSubscriptions() {
  const now = new Date();

  const expired = await db.vipSubscription.updateMany({
    where: {
      status: VipStatus.ACTIVE,
      endDate: { lte: now },
    },
    data: {
      status: VipStatus.EXPIRED,
    },
  });

  return { expiredCount: expired.count };
}
