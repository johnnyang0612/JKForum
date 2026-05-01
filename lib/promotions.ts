/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "./db";
import type { PromotionType } from "@prisma/client";

/**
 * 置頂商品定價表
 */
export type PromoConfig = {
  type: PromotionType;
  label: string;
  description: string;
  durationHours: number;
  priceCoins: number;
  priceTwd: number;
  scope: "forum" | "category" | "site_featured" | "site_hero" | "site_hot";
  emoji: string;
};

export const PROMO_CONFIGS: PromoConfig[] = [
  {
    type: "FORUM_PIN_24H",
    label: "版內置頂 24 小時",
    description: "你的文章釘選在該版頂部 1 天",
    durationHours: 24,
    priceCoins: 100,
    priceTwd: 30,
    scope: "forum",
    emoji: "📌",
  },
  {
    type: "FORUM_PIN_7D",
    label: "版內置頂 7 天",
    description: "你的文章釘選在該版頂部整週",
    durationHours: 24 * 7,
    priceCoins: 500,
    priceTwd: 150,
    scope: "forum",
    emoji: "📍",
  },
  {
    type: "CATEGORY_PIN_3D",
    label: "大分類置頂 3 天",
    description: "整個大分類底下的所有版都置頂顯示",
    durationHours: 24 * 3,
    priceCoins: 2500,
    priceTwd: 1000,
    scope: "category",
    emoji: "🏷️",
  },
  {
    type: "HOME_FEATURED_7D",
    label: "首頁精華推薦 7 天",
    description: "首頁「精華推薦」區自動入選",
    durationHours: 24 * 7,
    priceCoins: 2000,
    priceTwd: 500,
    scope: "site_featured",
    emoji: "⭐",
  },
  {
    type: "HOME_HERO_7D",
    label: "首頁 Hero 輪播 7 天",
    description: "首頁最頂端 4 張輪播 banner 之一（最高曝光）",
    durationHours: 24 * 7,
    priceCoins: 12000,
    priceTwd: 3000,
    scope: "site_hero",
    emoji: "🎯",
  },
  {
    type: "HOT_TOP_24H",
    label: "全站熱門推 24 小時",
    description: "首頁「熱門文章」第 1 位 1 天",
    durationHours: 24,
    priceCoins: 20000,
    priceTwd: 5000,
    scope: "site_hot",
    emoji: "🔥",
  },
];

export function getConfig(type: PromotionType): PromoConfig {
  return PROMO_CONFIGS.find((c) => c.type === type) ?? PROMO_CONFIGS[0];
}

/**
 * 用金幣自助購買 — 直接生 ACTIVE 訂單 + 套用置頂
 */
export async function buyPromotionWithCoins(opts: {
  userId: string;
  postId: string;
  type: PromotionType;
}) {
  const config = getConfig(opts.type);
  const post = await db.post.findUnique({
    where: { id: opts.postId },
    select: { id: true, authorId: true, title: true, forumId: true },
  });
  if (!post) throw new Error("文章不存在");
  if (post.authorId !== opts.userId) throw new Error("只能為自己的文章購買置頂");

  const points = await db.userPoints.findUnique({ where: { userId: opts.userId } });
  if (!points || points.coins < config.priceCoins) {
    throw new Error(`金幣不足，需 ${config.priceCoins}`);
  }

  // 扣金幣
  await db.userPoints.update({
    where: { userId: opts.userId },
    data: { coins: { decrement: config.priceCoins } },
  });

  // 建訂單 + 立即啟用
  const now = new Date();
  const endAt = new Date(now.getTime() + config.durationHours * 3600_000);
  const order = await db.promotionOrder.create({
    data: {
      postId: post.id,
      userId: opts.userId,
      type: opts.type,
      status: "ACTIVE",
      paymentMethod: "COINS",
      priceCoins: config.priceCoins,
      priceTwd: 0,
      startAt: now,
      endAt,
      paidAt: now,
    },
  });

  // 套用到文章
  await applyPromotion(post.id, opts.type);

  return { order, post: { id: post.id, title: post.title }, endAt };
}

/**
 * 使用置頂卡（voucher）
 */
export async function redeemPromotionVoucher(opts: {
  userId: string;
  postId: string;
  voucherId: string;
}) {
  const voucher = await db.promotionVoucher.findUnique({ where: { id: opts.voucherId } });
  if (!voucher || voucher.userId !== opts.userId) throw new Error("置頂卡不存在");
  if (voucher.usedAt) throw new Error("置頂卡已使用");
  if (voucher.expiresAt && voucher.expiresAt < new Date()) throw new Error("置頂卡已過期");

  const config = getConfig(voucher.type);
  const post = await db.post.findUnique({
    where: { id: opts.postId },
    select: { id: true, authorId: true, title: true },
  });
  if (!post) throw new Error("文章不存在");
  if (post.authorId !== opts.userId) throw new Error("只能為自己的文章使用");

  const now = new Date();
  const endAt = new Date(now.getTime() + config.durationHours * 3600_000);
  const order = await db.promotionOrder.create({
    data: {
      postId: post.id,
      userId: opts.userId,
      type: voucher.type,
      status: "ACTIVE",
      paymentMethod: "ADMIN_GIFT",
      priceCoins: 0,
      priceTwd: 0,
      startAt: now,
      endAt,
      paidAt: now,
      note: `Voucher #${voucher.id}`,
    },
  });
  await db.promotionVoucher.update({
    where: { id: voucher.id },
    data: { usedAt: now, usedOrderId: order.id },
  });
  await applyPromotion(post.id, voucher.type);
  return { order, endAt };
}

/**
 * 套用置頂效果到文章（依 type 改 isPinned/isFeatured 等）
 */
async function applyPromotion(postId: string, type: PromotionType) {
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
 * 撤銷已過期置頂
 */
export async function expireOldPromotions() {
  const now = new Date();
  const expired = await db.promotionOrder.findMany({
    where: { status: "ACTIVE", endAt: { lte: now } },
    select: { id: true, postId: true, type: true },
  });

  for (const o of expired) {
    await db.promotionOrder.update({
      where: { id: o.id },
      data: { status: "EXPIRED" },
    });
    // 檢查同篇文章是否還有其他 ACTIVE 訂單
    const stillActive = await db.promotionOrder.count({
      where: { postId: o.postId, status: "ACTIVE", endAt: { gt: now } },
    });
    if (stillActive === 0) {
      // 沒有 → 撤銷置頂效果
      const data: any = {};
      switch (o.type) {
        case "FORUM_PIN_24H":
        case "FORUM_PIN_7D":
        case "CATEGORY_PIN_3D":
          data.isPinned = false;
          data.pinnedAt = null;
          break;
        case "HOME_FEATURED_7D":
          data.isFeatured = false;
          data.featuredAt = null;
          break;
        case "HOME_HERO_7D":
        case "HOT_TOP_24H":
          data.isFeatured = false;
          data.featuredAt = null;
          data.isHighlighted = false;
          data.highlightColor = null;
          break;
      }
      if (Object.keys(data).length > 0) {
        await db.post.update({ where: { id: o.postId }, data });
      }
    }
  }
  return { expired: expired.length };
}

export async function getActivePromotions(postId: string) {
  return db.promotionOrder.findMany({
    where: { postId, status: "ACTIVE", endAt: { gt: new Date() } },
    orderBy: { endAt: "desc" },
  });
}
