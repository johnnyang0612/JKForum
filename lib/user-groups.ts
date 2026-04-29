import type { UserGroup } from "@prisma/client";
import { db } from "./db";

/**
 * 18 層會員組 — JKF 對齊
 */
export type GroupConfig = {
  group: UserGroup;
  label: string;
  readPower: number;       // 閱讀權限數值（1-200）
  iconEmoji: string;
  // 自動升級門檻（達標自動升）
  reqPosts?: number;       // 累計發文
  reqReputation?: number;  // 累計名聲
  reqDays?: number;        // 註冊天數
};

export const GROUPS: GroupConfig[] = [
  { group: "PEASANT",       label: "平民",     readPower: 10,  iconEmoji: "👤" },
  { group: "SQUIRE",        label: "鄉紳",     readPower: 20,  iconEmoji: "🎩",  reqPosts: 5,   reqDays: 7 },
  { group: "KNIGHT",        label: "騎士",     readPower: 30,  iconEmoji: "🛡️", reqPosts: 20,  reqDays: 14, reqReputation: 50 },
  { group: "BARON",         label: "男爵",     readPower: 40,  iconEmoji: "🏵️", reqPosts: 50,  reqReputation: 200 },
  { group: "VISCOUNT",      label: "子爵",     readPower: 50,  iconEmoji: "🎖️", reqPosts: 100, reqReputation: 500 },
  { group: "EARL",          label: "伯爵",     readPower: 60,  iconEmoji: "🏅", reqPosts: 200, reqReputation: 1000 },
  { group: "MARQUIS",       label: "侯爵",     readPower: 70,  iconEmoji: "🥉", reqPosts: 400, reqReputation: 2000 },
  { group: "DUKE",          label: "公爵",     readPower: 80,  iconEmoji: "🥈", reqPosts: 800, reqReputation: 4000 },
  { group: "PRINCE",        label: "親王",     readPower: 90,  iconEmoji: "🥇", reqPosts: 1500, reqReputation: 8000 },
  { group: "KING",          label: "國王",     readPower: 100, iconEmoji: "👑", reqPosts: 3000, reqReputation: 16000 },
  { group: "EMPEROR",       label: "皇帝",     readPower: 110, iconEmoji: "🤴", reqPosts: 6000, reqReputation: 32000 },
  { group: "IMMORTAL",      label: "仙人",     readPower: 120, iconEmoji: "🧙", reqPosts: 12000, reqReputation: 64000 },
  { group: "SAGE",          label: "聖人",     readPower: 130, iconEmoji: "🧘", reqPosts: 25000, reqReputation: 128000 },
  { group: "GOD",           label: "神祇",     readPower: 140, iconEmoji: "⚡",  reqPosts: 50000, reqReputation: 256000 },
  { group: "VIP",           label: "VIP",      readPower: 150, iconEmoji: "💎" }, // 由 VIP 訂閱觸發
  { group: "EDITOR",        label: "駐站編輯", readPower: 160, iconEmoji: "✏️" }, // 由管理員指派
  { group: "MODERATOR_GRP", label: "版主組",   readPower: 180, iconEmoji: "🛠️" }, // 由管理員指派
  { group: "ADMIN_GRP",     label: "站長組",   readPower: 200, iconEmoji: "🎯" }, // 由管理員指派
];

export function getGroupConfig(group: UserGroup): GroupConfig {
  return GROUPS.find((g) => g.group === group) ?? GROUPS[0];
}

/**
 * 權限矩陣 — 由 readPower 控制
 */
export const PERMISSION_MATRIX = {
  POST_CREATE:        { minReadPower: 10 },   // 發文
  REPLY_CREATE:       { minReadPower: 10 },   // 回覆
  HIDDEN_POST_CREATE: { minReadPower: 30 },   // 發隱藏帖
  PAID_POST_CREATE:   { minReadPower: 50 },   // 發付費帖
  VIP_POST_CREATE:    { minReadPower: 150 },  // 發 VIP 帖
  POLL_CREATE:        { minReadPower: 30 },   // 發投票帖
  POST_RATE:          { minReadPower: 20 },   // 評分文章
  TIP_OTHERS:         { minReadPower: 10 },   // 打賞
  CHAT_SEND:          { minReadPower: 10 },   // 聊天室發言
  CHAT_R18:           { minReadPower: 50 },   // R-18 聊天室發言
  FORUM_FOLLOW:       { minReadPower: 10 },
  CREATE_BLOG:        { minReadPower: 30 },   // 建個人日誌
} as const;

export type PermissionKey = keyof typeof PERMISSION_MATRIX;

export function canDo(readPermission: number, key: PermissionKey): boolean {
  return readPermission >= PERMISSION_MATRIX[key].minReadPower;
}

/**
 * 自動升級檢查：根據用戶累計數據，找最高符合的 group
 */
export async function maybePromote(userId: string): Promise<UserGroup | null> {
  const u = await db.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      points: true,
      vipSubscriptions: {
        where: { status: "ACTIVE", endDate: { gt: new Date() } },
        take: 1,
      },
    },
  });
  if (!u) return null;

  // 已經是管理組或編輯組 — 不自動降級
  if (u.userGroup === "ADMIN_GRP" || u.userGroup === "MODERATOR_GRP" || u.userGroup === "EDITOR") {
    return null;
  }

  // VIP 優先
  if (u.vipSubscriptions.length > 0 && u.userGroup !== "VIP") {
    await db.user.update({
      where: { id: userId },
      data: { userGroup: "VIP", readPermission: 150 },
    });
    return "VIP";
  }

  const posts = u.profile?.postCount ?? 0;
  const rep = u.points?.reputation ?? 0;
  const days = Math.floor((Date.now() - u.createdAt.getTime()) / 86400000);

  // 由高至低找第一個達標的（不含 VIP/編輯/版主/站長）
  const ladder = GROUPS.filter(
    (g) => !["VIP", "EDITOR", "MODERATOR_GRP", "ADMIN_GRP"].includes(g.group)
  );
  for (let i = ladder.length - 1; i >= 0; i--) {
    const g = ladder[i];
    const okPosts = g.reqPosts == null || posts >= g.reqPosts;
    const okRep = g.reqReputation == null || rep >= g.reqReputation;
    const okDays = g.reqDays == null || days >= g.reqDays;
    if (okPosts && okRep && okDays && g.group !== u.userGroup) {
      const newReadPower = g.readPower;
      const oldReadPower = u.readPermission;
      // 只升不降
      if (newReadPower > oldReadPower) {
        await db.user.update({
          where: { id: userId },
          data: { userGroup: g.group, readPermission: newReadPower },
        });
        return g.group;
      }
      return null;
    }
  }
  return null;
}
