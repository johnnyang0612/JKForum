import { db } from "@/lib/db";
import type { AdminActionType } from "@prisma/client";

/**
 * 業者/KYC/折扣碼/敏感詞等業務操作沒有 enum，統一寫到 SETTINGS_CHANGE
 * 把實際語義塞 detail 開頭：「[BUSINESS_AD_APPROVE] ad=xxx 通過」
 */
export type BusinessLogAction =
  | "BUSINESS_AD_APPROVE"
  | "BUSINESS_AD_REJECT"
  | "BUSINESS_AD_REMOVE"
  | "BUSINESS_KYC_APPROVE"
  | "BUSINESS_KYC_REJECT"
  | "WITHDRAWAL_APPROVE"
  | "WITHDRAWAL_REJECT"
  | "WITHDRAWAL_PAID"
  | "COUPON_CREATE"
  | "COUPON_TOGGLE"
  | "BANNED_WORD_ADD"
  | "BANNED_WORD_REMOVE"
  | "USER_BULK_ACTION";

export async function logAdminAction(opts: {
  adminId: string;
  action: BusinessLogAction | AdminActionType;
  targetType: string;
  targetId: string;
  detail?: string;
}) {
  const isBusinessAction = !["USER_BAN", "USER_UNBAN", "USER_MUTE", "USER_UNMUTE",
    "POST_DELETE", "POST_HIDE", "POST_PIN", "POST_UNPIN", "POST_FEATURE", "POST_LOCK",
    "POST_MOVE", "REPLY_DELETE", "FORUM_CREATE", "FORUM_EDIT", "FORUM_DELETE",
    "REPORT_RESOLVE", "REPORT_DISMISS", "POINTS_ADJUST", "LEVEL_ADJUST",
    "SETTINGS_CHANGE"].includes(opts.action as string);

  return db.adminLog.create({
    data: {
      adminId: opts.adminId,
      action: isBusinessAction ? "SETTINGS_CHANGE" : (opts.action as AdminActionType),
      targetType: opts.targetType.slice(0, 50),
      targetId: opts.targetId,
      detail: isBusinessAction
        ? `[${opts.action}] ${opts.detail ?? ""}`.slice(0, 1000)
        : opts.detail?.slice(0, 1000),
    },
  }).catch(() => null);
}
