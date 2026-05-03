/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "./db";
import type { PromotionType } from "@prisma/client";

/**
 * 發放置頂卡 — 自動防重複（同 source 同用戶不重發）
 */
export async function grantVoucher(opts: {
  userId: string;
  type: PromotionType;
  source: string;          // unique key per grant event (e.g. checkin_streak_30_2026-05-03)
  expiresInDays?: number;
  note?: string;
}) {
  const existing = await db.promotionVoucher.findFirst({
    where: { userId: opts.userId, source: opts.source },
  });
  if (existing) return { granted: false, voucher: existing, reason: "duplicate" };

  const voucher = await db.promotionVoucher.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      source: opts.source,
      expiresAt: opts.expiresInDays
        ? new Date(Date.now() + opts.expiresInDays * 86400_000)
        : null,
    },
  });
  // 同時發通知
  try {
    await db.notification.create({
      data: {
        recipientId: opts.userId,
        type: "ACHIEVEMENT",
        title: "獲得置頂卡 🎟️",
        content: opts.note ?? `來源：${opts.source}`,
        linkUrl: "/promote",
      },
    });
  } catch {}
  return { granted: true, voucher };
}

/**
 * 簽到連續 N 天觸發
 * - 7 天 → FORUM_PIN_24H
 * - 30 天 → FORUM_PIN_24H × 1（這次發的）
 * - 100 天 → HOME_FEATURED_7D
 */
export async function maybeGrantCheckinVoucher(userId: string, streak: number, checkinId: string) {
  const grants: { type: PromotionType; source: string; note: string }[] = [];
  if (streak === 7) {
    grants.push({
      type: "FORUM_PIN_24H",
      source: `checkin_streak_7_${checkinId}`,
      note: "連續簽到 7 天獎勵 — 版內置頂 24h 卡 1 張",
    });
  } else if (streak === 30) {
    grants.push({
      type: "FORUM_PIN_24H",
      source: `checkin_streak_30_${checkinId}`,
      note: "連續簽到 30 天獎勵 — 版內置頂 24h 卡 1 張",
    });
  } else if (streak === 100) {
    grants.push({
      type: "HOME_FEATURED_7D",
      source: `checkin_streak_100_${checkinId}`,
      note: "連續簽到 100 天獎勵 — 首頁精華 7d 卡 1 張",
    });
  } else if (streak % 365 === 0 && streak > 0) {
    grants.push({
      type: "HOME_HERO_7D",
      source: `checkin_streak_year_${streak}_${checkinId}`,
      note: `連續簽到 ${streak} 天 — 首頁 Hero 卡 1 張`,
    });
  }

  const results = [];
  for (const g of grants) {
    results.push(await grantVoucher({ userId, ...g }));
  }
  return results;
}

/**
 * 任務完成觸發（如「主題達人」發 50 篇）
 */
export async function maybeGrantTaskVoucher(userId: string, taskId: string, taskName: string) {
  // 達人類任務（含「達人」關鍵字 / 100+ 發文 / 50+ 回覆等）發 HOME_FEATURED_7D
  const isMaster = /達人|主題|王者|傳說/.test(taskName);
  if (isMaster) {
    return grantVoucher({
      userId,
      type: "HOME_FEATURED_7D",
      source: `task_${taskId}`,
      note: `完成「${taskName}」獎勵 — 首頁精華 7d 卡 1 張`,
    });
  }
  return null;
}

/**
 * VIP 月卡觸發 — 訂閱期內每月發 2 張 FORUM_PIN_7D
 * （由 cron 每天 00:30 跑）
 */
export async function grantVipMonthlyVouchers() {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

  const activeVips = await db.user.findMany({
    where: {
      userGroup: "VIP",
      vipSubscriptions: {
        some: { status: "ACTIVE", endDate: { gt: now } },
      },
    },
    select: { id: true },
  });

  let granted = 0;
  for (const u of activeVips) {
    // 1 號發第 1 張，15 號發第 2 張（避免一次給）
    const day = now.getDate();
    if (day === 1 || day === 15) {
      const r = await grantVoucher({
        userId: u.id,
        type: "FORUM_PIN_7D",
        source: `vip_monthly_${yyyymm}_d${day}`,
        note: "VIP 月卡福利 — 版內置頂 7d 卡",
      });
      if (r.granted) granted++;
    }
  }
  return { eligible: activeVips.length, granted };
}

/**
 * 推廣拉新 — 每邀請 5 人發 1 張 FORUM_PIN_24H
 */
export async function maybeGrantReferralVoucher(inviterId: string) {
  const total = await db.inviteUse.count({ where: { inviterId } });
  // 每滿 5 人發一次（5/10/15/...）
  if (total > 0 && total % 5 === 0) {
    return grantVoucher({
      userId: inviterId,
      type: "FORUM_PIN_24H",
      source: `referral_${total}`,
      note: `成功推廣 ${total} 位新會員獎勵`,
    });
  }
  return null;
}
