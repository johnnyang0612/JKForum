import { db } from "@/lib/db";

/**
 * 記錄用戶行為（fire-and-forget；失敗不影響主邏輯）
 */
export function trackActivity(opts: {
  userId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}) {
  return db.userActivity.create({
    data: {
      userId: opts.userId,
      action: opts.action.slice(0, 40),
      targetType: opts.targetType?.slice(0, 30),
      targetId: opts.targetId,
      metadata: opts.metadata ? (opts.metadata as never) : undefined,
      ip: opts.ip?.slice(0, 45),
    },
  }).catch(() => null);
}
