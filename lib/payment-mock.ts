/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Payment Mock — Demo 用
 * 流程：
 *   1. 前端建單 (status=PENDING) + 取得 mockPaymentUrl
 *   2. 跳轉到 /checkout/mock?orderId=xxx
 *   3. 倒數 3 秒 → 自動 POST /api/payment/mock/callback
 *   4. callback 把訂單 mark ACTIVE + 套用置頂效果
 */
import { db } from "./db";
import type { PaymentMethod, PromotionType } from "@prisma/client";

// 套用置頂效果（複製自 promotions.ts，避免循環依賴）
async function applyPromotionLocal(postId: string, type: PromotionType) {
  const data: any = {};
  switch (type) {
    case "FORUM_PIN_24H":
    case "FORUM_PIN_7D":
    case "CATEGORY_PIN_3D":
      data.isPinned = true;
      data.pinnedAt = new Date();
      break;
    case "HOME_FEATURED_7D":
      data.isFeatured = true;
      data.featuredAt = new Date();
      break;
    case "HOME_HERO_7D":
    case "HOT_TOP_24H":
      data.isFeatured = true;
      data.featuredAt = new Date();
      data.isHighlighted = true;
      data.highlightColor = "#f59e0b";
      break;
  }
  if (Object.keys(data).length > 0) {
    await db.post.update({ where: { id: postId }, data });
  }
}

/**
 * 建立 PromotionOrder (PENDING + 真金額)
 */
export async function createPromotionPaymentOrder(opts: {
  userId: string;
  postId: string;
  type: PromotionType;
  paymentMethod: PaymentMethod;
  priceTwd: number;
  durationHours: number;
}) {
  const post = await db.post.findUnique({
    where: { id: opts.postId },
    select: { authorId: true, title: true },
  });
  if (!post) throw new Error("文章不存在");
  if (post.authorId !== opts.userId) throw new Error("只能為自己的文章購買");

  const order = await db.promotionOrder.create({
    data: {
      postId: opts.postId,
      userId: opts.userId,
      type: opts.type,
      status: "PENDING",
      paymentMethod: opts.paymentMethod,
      priceCoins: 0,
      priceTwd: opts.priceTwd,
      paymentRef: `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      note: `${opts.paymentMethod} mock 付款`,
    },
  });
  return order;
}

/**
 * Mock callback — 把訂單啟用
 */
export async function handlePromotionPaymentCallback(orderId: string) {
  const order = await db.promotionOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("訂單不存在");
  if (order.status !== "PENDING") throw new Error("訂單狀態錯誤");

  // 取 config 算到期時間
  const { getConfig } = await import("./promotions");
  const config = getConfig(order.type);
  const now = new Date();
  const endAt = new Date(now.getTime() + config.durationHours * 3600_000);

  await db.promotionOrder.update({
    where: { id: orderId },
    data: {
      status: "ACTIVE",
      startAt: now,
      endAt,
      paidAt: now,
    },
  });
  await applyPromotionLocal(order.postId, order.type);

  return { order: { ...order, status: "ACTIVE", paidAt: now, endAt } };
}

// ─── VIP 訂閱 mock ───
export async function createVipPaymentOrder(opts: {
  userId: string;
  plan: "MONTHLY" | "QUARTERLY" | "YEARLY";
  paymentMethod: PaymentMethod;
}) {
  const PRICES = { MONTHLY: 99, QUARTERLY: 249, YEARLY: 799 };
  const DAYS = { MONTHLY: 30, QUARTERLY: 90, YEARLY: 365 };
  // 重用 PromotionOrder 結構記 VIP 訂單（以 note 區分）
  // 也可以另建 VipPaymentOrder model；先用最簡單方案
  const order = await db.promotionOrder.create({
    data: {
      postId: "vip-subscription",  // dummy postId
      userId: opts.userId,
      type: "FORUM_PIN_24H",       // dummy
      status: "PENDING",
      paymentMethod: opts.paymentMethod,
      priceCoins: 0,
      priceTwd: PRICES[opts.plan],
      paymentRef: `VIP-MOCK-${Date.now()}`,
      note: `VIP_${opts.plan}_${DAYS[opts.plan]}d`,
    },
  });
  return order;
}

export async function handleVipPaymentCallback(orderId: string) {
  const order = await db.promotionOrder.findUnique({ where: { id: orderId } });
  if (!order || !order.note?.startsWith("VIP_")) throw new Error("VIP 訂單不存在");
  if (order.status !== "PENDING") throw new Error("訂單狀態錯誤");

  // 解析 plan / days
  const m = order.note.match(/VIP_(\w+)_(\d+)d/);
  if (!m) throw new Error("VIP 訂單格式錯誤");
  const plan = m[1] as "MONTHLY" | "QUARTERLY" | "YEARLY";
  const days = parseInt(m[2]);

  const now = new Date();
  const endDate = new Date(now.getTime() + days * 86400_000);

  // 建 VIP 訂閱
  await db.vipSubscription.create({
    data: {
      userId: order.userId,
      plan,
      status: "ACTIVE",
      startDate: now,
      endDate,
      autoRenew: false,
    },
  });

  // 升 user group VIP
  await db.user.update({
    where: { id: order.userId },
    data: { userGroup: "VIP", readPermission: 150 },
  });

  // 訂單 mark ACTIVE
  await db.promotionOrder.update({
    where: { id: orderId },
    data: { status: "ACTIVE", startAt: now, endAt: endDate, paidAt: now },
  });

  return { plan, days, endDate };
}

// ─── 下載額度 mock ───
export async function createCreditsPaymentOrder(opts: {
  userId: string;
  credits: number;
  paymentMethod: PaymentMethod;
}) {
  const priceTwd = opts.credits * 5; // 5 元 / 1 額度
  const order = await db.promotionOrder.create({
    data: {
      postId: "credits-purchase",
      userId: opts.userId,
      type: "FORUM_PIN_24H",
      status: "PENDING",
      paymentMethod: opts.paymentMethod,
      priceCoins: 0,
      priceTwd,
      paymentRef: `CREDIT-MOCK-${Date.now()}`,
      note: `CREDITS_${opts.credits}`,
    },
  });
  return order;
}

export async function handleCreditsPaymentCallback(orderId: string) {
  const order = await db.promotionOrder.findUnique({ where: { id: orderId } });
  if (!order || !order.note?.startsWith("CREDITS_")) throw new Error("額度訂單不存在");
  if (order.status !== "PENDING") throw new Error("訂單狀態錯誤");
  const credits = parseInt(order.note.replace("CREDITS_", ""));
  const { addCredits } = await import("./download-engine");
  await addCredits({
    userId: order.userId,
    amount: credits,
    reason: "EARN_PURCHASE",
    note: `${order.paymentMethod} 真金流購買 ${credits} 額度`,
  });
  await db.promotionOrder.update({
    where: { id: orderId },
    data: { status: "ACTIVE", startAt: new Date(), paidAt: new Date() },
  });
  return { credits };
}
