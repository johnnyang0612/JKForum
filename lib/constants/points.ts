/**
 * 積分獲取規則
 * reputation: 名聲
 * coins: 金幣
 * platinum: 白金幣
 */
export const POINT_RULES = {
  POST_CREATED: {
    reputation: 10,
    coins: 50,
    energy: 10,
    description: "發表文章",
  },
  POST_LIKED: {
    reputation: 5,
    coins: 10,
    description: "文章被按讚",
  },
  POST_DISLIKED: {
    reputation: -2,
    description: "文章被倒讚",
  },
  REPLY_CREATED: {
    reputation: 5,
    coins: 20,
    energy: 5,
    description: "發表回覆",
  },
  REPLY_LIKED: {
    reputation: 3,
    coins: 5,
    description: "回覆被按讚",
  },
  DAILY_CHECKIN: {
    coins: 30,
    energy: 20,
    description: "每日簽到",
  },
  CHECKIN_STREAK_3: {
    coins: 50,
    energy: 30,
    description: "連續簽到 3 天獎勵",
  },
  CHECKIN_STREAK_7: {
    coins: 100,
    energy: 50,
    description: "連續簽到 7 天獎勵",
  },
  CHECKIN_STREAK_30: {
    coins: 300,
    energy: 100,
    platinum: 10,
    description: "連續簽到 30 天獎勵",
  },
  ACHIEVEMENT_UNLOCK: {
    reputation: 20,
    coins: 50,
    description: "成就解鎖",
  },
  FIRST_POST: {
    reputation: 20,
    coins: 100,
    description: "發表第一篇文章",
  },
  FIRST_REPLY: {
    reputation: 10,
    coins: 50,
    description: "發表第一則回覆",
  },
} as const;

export type PointRuleKey = keyof typeof POINT_RULES;

/**
 * 取得特定規則的積分值
 */
export function getPointReward(rule: PointRuleKey) {
  return POINT_RULES[rule];
}
