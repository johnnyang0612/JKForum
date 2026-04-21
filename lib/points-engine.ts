import { db } from "./db";
import type { Prisma } from "@prisma/client";

export type PointAction =
  | "login"
  | "checkin"
  | "avatar_change"
  | "signature_change"
  | "post_create"
  | "reply_create"
  | "tip_post"
  | "like_post"
  | "like_reply"
  | "post_featured"
  | "post_liked"
  | "reply_liked"
  | "vote_join";

export interface PointDelta {
  reputation?: number;
  coins?: number;
  hearts?: number;
  given?: number;
  energy?: number;
  gems?: number;
  platinum?: number;
  invites?: number;
}

export interface EarnResult {
  granted: boolean;
  reason?: "rate_limited" | "rule_not_found" | "rule_disabled" | "ok";
  delta?: PointDelta;
  ledgerId?: string;
}

export interface EarnOptions {
  userId: string;
  action: PointAction | string;
  relatedId?: string;
  relatedType?: "post" | "reply" | "user";
  forumId?: string;
  note?: string;
}

/**
 * Core: grant points for an action.
 * - Looks up rule
 * - Checks period limit (daily/weekly)
 * - Atomically updates user_points + writes ledger entry
 * - Returns whether granted and the delta
 *
 * Idempotent on the request level (no idempotency key yet — caller should
 * ensure action triggers once per event).
 */
export async function earnPoints(opts: EarnOptions): Promise<EarnResult> {
  const rule = await db.pointRule.findUnique({ where: { action: opts.action } });
  if (!rule) return { granted: false, reason: "rule_not_found" };
  if (!rule.isActive) return { granted: false, reason: "rule_disabled" };

  // Check period / maxTimes
  if (rule.cycle && rule.maxTimes != null) {
    const since = periodStart(rule.cycle);
    const whereClause: Prisma.PointLedgerWhereInput = {
      userId: opts.userId,
      action: opts.action,
      createdAt: { gte: since },
    };
    if (rule.scope === "forum" && opts.forumId) {
      whereClause.forumId = opts.forumId;
    }
    const count = await db.pointLedger.count({ where: whereClause });
    if (count >= rule.maxTimes) {
      return { granted: false, reason: "rate_limited" };
    }
  }

  const delta: PointDelta = {};
  if (rule.rewardReputation) delta.reputation = rule.rewardReputation;
  if (rule.rewardCoins) delta.coins = rule.rewardCoins;
  if (rule.rewardHearts) delta.hearts = rule.rewardHearts;
  if (rule.rewardGiven) delta.given = rule.rewardGiven;
  if (rule.rewardEnergy) delta.energy = rule.rewardEnergy;
  if (rule.rewardGems) delta.gems = rule.rewardGems;

  // Skip if no reward at all (rule exists but zero)
  if (Object.values(delta).every((v) => !v)) {
    // still write ledger for auditing but no points update
  }

  // Ensure UserPoints row exists
  await db.userPoints.upsert({
    where: { userId: opts.userId },
    create: { userId: opts.userId },
    update: {},
  });

  // Use transaction to update points + write ledger
  const total =
    (delta.reputation || 0) +
    (delta.coins || 0) +
    (delta.hearts || 0) +
    (delta.given || 0) +
    (delta.energy || 0) +
    (delta.gems || 0);

  const [, ledger] = await db.$transaction([
    db.userPoints.update({
      where: { userId: opts.userId },
      data: {
        reputation: { increment: delta.reputation || 0 },
        coins: { increment: delta.coins || 0 },
        hearts: { increment: delta.hearts || 0 },
        given: { increment: delta.given || 0 },
        // Cap energy at 100
        energy: delta.energy ? { increment: delta.energy } : undefined,
        gems: { increment: delta.gems || 0 },
        totalPoints: { increment: total },
      },
    }),
    db.pointLedger.create({
      data: {
        userId: opts.userId,
        action: opts.action,
        delta: delta as Prisma.InputJsonValue,
        relatedId: opts.relatedId,
        relatedType: opts.relatedType,
        forumId: opts.forumId,
        note: opts.note,
      },
    }),
  ]);

  // Cap energy at 100 separately (increment doesn't support MIN/MAX)
  if (delta.energy) {
    await db.userPoints.updateMany({
      where: { userId: opts.userId, energy: { gt: 100 } },
      data: { energy: 100 },
    });
  }

  return { granted: true, reason: "ok", delta, ledgerId: ledger.id };
}

/**
 * Spend points (negative delta). For purchases, tips etc.
 * Fails if user has insufficient balance in the specified currency.
 */
export async function spendPoints(opts: {
  userId: string;
  currency: "coins" | "platinum" | "hearts" | "gems";
  amount: number;
  reason: string;
  relatedId?: string;
  relatedType?: "post" | "reply" | "user";
  note?: string;
}): Promise<EarnResult> {
  if (opts.amount <= 0) return { granted: false, reason: "rule_not_found" };

  const pts = await db.userPoints.findUnique({ where: { userId: opts.userId } });
  if (!pts) return { granted: false, reason: "rule_not_found" };
  const bal = pts[opts.currency] ?? 0;
  if (bal < opts.amount) {
    return { granted: false, reason: "rate_limited" /* insufficient */ };
  }

  const delta: PointDelta = { [opts.currency]: -opts.amount };

  const [, ledger] = await db.$transaction([
    db.userPoints.update({
      where: { userId: opts.userId },
      data: {
        [opts.currency]: { decrement: opts.amount },
        totalPoints: { decrement: opts.amount },
      },
    }),
    db.pointLedger.create({
      data: {
        userId: opts.userId,
        action: `spend_${opts.reason}`,
        delta: delta as Prisma.InputJsonValue,
        relatedId: opts.relatedId,
        relatedType: opts.relatedType,
        note: opts.note,
      },
    }),
  ]);

  return { granted: true, reason: "ok", delta, ledgerId: ledger.id };
}

function periodStart(cycle: string): Date {
  const d = new Date();
  if (cycle === "daily") {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (cycle === "weekly") {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (cycle === "monthly") {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  return new Date(0);
}

/** Safe wrapper — never throws, logs and returns not-granted on error. */
export async function earnPointsSafe(
  opts: EarnOptions
): Promise<EarnResult> {
  try {
    return await earnPoints(opts);
  } catch (e) {
    console.error("[points-engine] earn failed", opts.action, e);
    return { granted: false, reason: "rule_not_found" };
  }
}
