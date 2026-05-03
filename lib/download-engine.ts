/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "./db";
import type { CreditChangeReason } from "@prisma/client";

const COINS_PER_CREDIT = 100; // 100 金幣 = 1 額度

/**
 * 取得用戶當前下載額度
 */
export async function getCredit(userId: string) {
  const c = await db.downloadCredit.findUnique({ where: { userId } });
  return c?.balance ?? 0;
}

/**
 * 加額度（任務 / 簽到 / VIP / 推廣 / 管理員贈送 / 金幣換）
 */
export async function addCredits(opts: {
  userId: string;
  amount: number;
  reason: CreditChangeReason;
  relatedId?: string;
  note?: string;
}) {
  if (opts.amount <= 0) throw new Error("數量需 > 0");
  const cred = await db.downloadCredit.upsert({
    where: { userId: opts.userId },
    create: {
      userId: opts.userId,
      balance: opts.amount,
      totalEarned: opts.amount,
    },
    update: {
      balance: { increment: opts.amount },
      totalEarned: { increment: opts.amount },
    },
  });
  await db.downloadCreditLedger.create({
    data: {
      userId: opts.userId,
      delta: opts.amount,
      balance: cred.balance,
      reason: opts.reason,
      relatedId: opts.relatedId,
      note: opts.note,
    },
  });
  return cred;
}

/**
 * 金幣換下載額度（100 金幣 = 1 額度）
 */
export async function purchaseCreditsWithCoins(userId: string, credits: number) {
  if (credits < 1 || credits > 1000) throw new Error("一次最多換 1000 額度");
  const coinsCost = credits * COINS_PER_CREDIT;
  const points = await db.userPoints.findUnique({ where: { userId } });
  if (!points || points.coins < coinsCost) {
    throw new Error(`金幣不足，需 ${coinsCost}`);
  }
  await db.userPoints.update({
    where: { userId },
    data: { coins: { decrement: coinsCost } },
  });
  return addCredits({
    userId,
    amount: credits,
    reason: "EARN_PURCHASE",
    note: `用 ${coinsCost} 金幣兌換`,
  });
}

/**
 * 下載資源 — 扣額度（優先）或金幣
 */
export async function redeemDownload(opts: {
  userId: string;
  resourceId: string;
  payWith?: "credits" | "coins";
}) {
  const resource = await db.downloadResource.findUnique({
    where: { id: opts.resourceId },
  });
  if (!resource || !resource.isActive) throw new Error("資源不存在或已下架");

  // 18 層權限檢查
  const user = await db.user.findUnique({
    where: { id: opts.userId },
    select: {
      readPermission: true,
      ageConfirmedAt: true,
      vipSubscriptions: {
        where: { status: "ACTIVE", endDate: { gt: new Date() } },
        take: 1,
      },
    },
  });
  if (!user) throw new Error("用戶不存在");
  if (user.readPermission < resource.minReadPower) {
    throw new Error(`需閱讀權限 ${resource.minReadPower}（目前 ${user.readPermission}）`);
  }
  if (resource.requiresVip && user.vipSubscriptions.length === 0) {
    throw new Error("此資源僅 VIP 可下載");
  }
  if (resource.rating === "R18" && !user.ageConfirmedAt) {
    throw new Error("需先通過年齡驗證");
  }

  // 是否已下載過 — 不再扣費（但記錄一次新 history）
  const existing = await db.downloadHistory.findFirst({
    where: { userId: opts.userId, resourceId: opts.resourceId },
  });
  if (existing) {
    await db.downloadHistory.create({
      data: {
        userId: opts.userId,
        resourceId: opts.resourceId,
        paidCredits: 0,
        paidCoins: 0,
      },
    });
    return { resource, redownload: true };
  }

  // 結帳
  const payWith = opts.payWith ?? "credits";
  let paidCredits = 0;
  let paidCoins = 0;

  if (payWith === "credits" && resource.costCredits > 0) {
    const cred = await db.downloadCredit.findUnique({ where: { userId: opts.userId } });
    if (!cred || cred.balance < resource.costCredits) {
      throw new Error(`下載額度不足，需 ${resource.costCredits} 額度`);
    }
    paidCredits = resource.costCredits;
    await db.downloadCredit.update({
      where: { userId: opts.userId },
      data: {
        balance: { decrement: resource.costCredits },
        totalSpent: { increment: resource.costCredits },
      },
    });
    await db.downloadCreditLedger.create({
      data: {
        userId: opts.userId,
        delta: -resource.costCredits,
        balance: cred.balance - resource.costCredits,
        reason: "SPEND_DOWNLOAD",
        relatedId: opts.resourceId,
        note: `下載 ${resource.title}`,
      },
    });
  } else if (payWith === "coins" && resource.costCoins > 0) {
    const points = await db.userPoints.findUnique({ where: { userId: opts.userId } });
    if (!points || points.coins < resource.costCoins) {
      throw new Error(`金幣不足，需 ${resource.costCoins}`);
    }
    paidCoins = resource.costCoins;
    await db.userPoints.update({
      where: { userId: opts.userId },
      data: { coins: { decrement: resource.costCoins } },
    });
  } else if (resource.costCredits === 0 && resource.costCoins === 0) {
    // 免費資源
  } else {
    throw new Error("付費方式無效");
  }

  // 記錄 history + 增加下載數
  await db.downloadHistory.create({
    data: {
      userId: opts.userId,
      resourceId: opts.resourceId,
      paidCredits,
      paidCoins,
    },
  });
  await db.downloadResource.update({
    where: { id: opts.resourceId },
    data: { downloadCount: { increment: 1 } },
  });

  return { resource, paidCredits, paidCoins, redownload: false };
}

/**
 * 任務完成獎勵下載額度
 */
export async function maybeGrantTaskCredits(userId: string, taskId: string, taskName: string, taskType: string) {
  // 達成類任務多送 (DAILY 1, NEWBIE 3, ACHIEVEMENT 5)
  let amount = 1;
  if (taskType === "NEWBIE") amount = 3;
  else if (taskType === "ACHIEVEMENT") amount = 5;
  return addCredits({
    userId,
    amount,
    reason: "EARN_TASK",
    relatedId: taskId,
    note: `完成「${taskName}」獎勵 ${amount} 下載額度`,
  });
}
