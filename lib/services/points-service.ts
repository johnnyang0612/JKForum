import { db } from "@/lib/db";
import { PointType, PointChangeReason } from "@prisma/client";
import { POINT_RULES, PointRuleKey } from "@/lib/constants/points";
import { getLevelByPoints } from "@/lib/constants/levels";

/**
 * 獎勵積分給用戶
 */
export async function awardPoints(
  userId: string,
  ruleKey: PointRuleKey,
  relatedId?: string
) {
  const rule = POINT_RULES[ruleKey];

  // 建立積分變動記錄並更新用戶積分
  const operations = [];

  // 名聲變動
  if ("reputation" in rule && rule.reputation) {
    operations.push(
      db.pointHistory.create({
        data: {
          userId,
          type: PointType.REPUTATION,
          amount: rule.reputation,
          reason: mapRuleToReason(ruleKey),
          detail: rule.description,
          relatedId,
        },
      })
    );
  }

  // 金幣變動
  if ("coins" in rule && rule.coins) {
    operations.push(
      db.pointHistory.create({
        data: {
          userId,
          type: PointType.COINS,
          amount: rule.coins,
          reason: mapRuleToReason(ruleKey),
          detail: rule.description,
          relatedId,
        },
      })
    );
  }

  // 白金幣變動
  if ("platinum" in rule && rule.platinum) {
    operations.push(
      db.pointHistory.create({
        data: {
          userId,
          type: PointType.PLATINUM,
          amount: rule.platinum,
          reason: mapRuleToReason(ruleKey),
          detail: rule.description,
          relatedId,
        },
      })
    );
  }

  // 更新用戶積分總表
  const reputationDelta = ("reputation" in rule && rule.reputation) ? rule.reputation : 0;
  const coinsDelta = ("coins" in rule && rule.coins) ? rule.coins : 0;
  const platinumDelta = ("platinum" in rule && rule.platinum) ? rule.platinum : 0;
  const totalDelta = reputationDelta + coinsDelta;

  operations.push(
    db.userPoints.upsert({
      where: { userId },
      create: {
        userId,
        reputation: Math.max(0, reputationDelta),
        coins: Math.max(0, coinsDelta),
        platinum: Math.max(0, platinumDelta),
        totalPoints: Math.max(0, totalDelta),
        level: 16, // 預設平民
      },
      update: {
        reputation: { increment: reputationDelta },
        coins: { increment: coinsDelta },
        platinum: { increment: platinumDelta },
        totalPoints: { increment: totalDelta },
      },
    })
  );

  await db.$transaction(operations);

  // 檢查並更新等級
  await checkAndUpdateLevel(userId);
}

/**
 * 扣除積分
 */
export async function deductPoints(
  userId: string,
  type: PointType,
  amount: number,
  reason: string
) {
  const absAmount = Math.abs(amount);

  await db.$transaction([
    db.pointHistory.create({
      data: {
        userId,
        type,
        amount: -absAmount,
        reason: PointChangeReason.PENALTY,
        detail: reason,
      },
    }),
    db.userPoints.update({
      where: { userId },
      data: {
        [type.toLowerCase()]: { decrement: absAmount },
        totalPoints: {
          decrement: type === PointType.REPUTATION || type === PointType.COINS ? absAmount : 0,
        },
      },
    }),
  ]);

  await checkAndUpdateLevel(userId);
}

/**
 * 管理員手動調整積分
 */
export async function adminAdjustPoints(
  userId: string,
  type: PointType,
  amount: number,
  detail: string
) {
  await db.$transaction([
    db.pointHistory.create({
      data: {
        userId,
        type,
        amount,
        reason: PointChangeReason.ADMIN_ADJUST,
        detail,
      },
    }),
    db.userPoints.update({
      where: { userId },
      data: {
        [type.toLowerCase()]: { increment: amount },
        totalPoints: {
          increment: type === PointType.REPUTATION || type === PointType.COINS ? amount : 0,
        },
      },
    }),
  ]);

  await checkAndUpdateLevel(userId);
}

/**
 * 檢查並更新用戶等級
 */
export async function checkAndUpdateLevel(userId: string) {
  const userPoints = await db.userPoints.findUnique({
    where: { userId },
  });

  if (!userPoints) return;

  const newLevel = getLevelByPoints(userPoints.totalPoints);

  if (newLevel.index !== userPoints.level) {
    const isLevelUp = newLevel.index < userPoints.level; // index 越小等級越高

    await db.userPoints.update({
      where: { userId },
      data: { level: newLevel.index },
    });

    // 升級通知
    if (isLevelUp) {
      await db.notification.create({
        data: {
          recipientId: userId,
          type: "LEVEL_UP",
          title: `恭喜升級為「${newLevel.name}」！`,
          content: `您的等級已提升為${newLevel.name}，繼續努力！`,
          linkUrl: `/profile`,
        },
      });
    }
  }
}

/**
 * 將規則 key 映射到 PointChangeReason enum
 */
function mapRuleToReason(ruleKey: PointRuleKey): PointChangeReason {
  const mapping: Record<string, PointChangeReason> = {
    POST_CREATED: PointChangeReason.POST_CREATED,
    POST_LIKED: PointChangeReason.POST_LIKED,
    POST_DISLIKED: PointChangeReason.POST_LIKED,
    REPLY_CREATED: PointChangeReason.REPLY_CREATED,
    REPLY_LIKED: PointChangeReason.REPLY_LIKED,
    DAILY_CHECKIN: PointChangeReason.DAILY_CHECKIN,
    CHECKIN_STREAK_3: PointChangeReason.CHECKIN_STREAK,
    CHECKIN_STREAK_7: PointChangeReason.CHECKIN_STREAK,
    CHECKIN_STREAK_30: PointChangeReason.CHECKIN_STREAK,
    ACHIEVEMENT_UNLOCK: PointChangeReason.ACHIEVEMENT_UNLOCK,
    FIRST_POST: PointChangeReason.POST_CREATED,
    FIRST_REPLY: PointChangeReason.REPLY_CREATED,
  };

  return mapping[ruleKey] || PointChangeReason.ADMIN_ADJUST;
}
