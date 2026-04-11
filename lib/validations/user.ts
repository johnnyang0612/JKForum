import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z.string().min(1, "請輸入顯示名稱").max(50, "顯示名稱不能超過 50 字"),
  bio: z.string().max(500, "自我介紹不能超過 500 字").optional(),
  signature: z.string().max(200, "個性簽名不能超過 200 字").optional(),
  website: z.string().url("請輸入有效的網址").max(255).optional().or(z.literal("")),
  location: z.string().max(100).optional(),
  gender: z.string().max(10).optional(),
  isPublic: z.boolean().default(true),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "請輸入目前密碼"),
  newPassword: z.string().min(8, "新密碼至少 8 個字元"),
  confirmPassword: z.string().min(1, "請確認新密碼"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "兩次輸入的密碼不一致",
  path: ["confirmPassword"],
});

export const adminUserActionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["ban", "unban", "mute", "unmute"]),
  reason: z.string().max(500).optional(),
});

export const adminPointsAdjustSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["REPUTATION", "COINS", "PLATINUM"]),
  amount: z.number().int(),
  detail: z.string().min(1, "請輸入調整原因").max(200),
});

export const createForumSchema = z.object({
  categoryId: z.string().min(1, "請選擇分類"),
  name: z.string().min(1, "請輸入看板名稱").max(100),
  slug: z.string().min(1, "請輸入看板代稱").max(100).regex(/^[a-z0-9-]+$/, "只能使用小寫英文、數字和連字號"),
  description: z.string().max(1000).optional(),
  rules: z.string().max(5000).optional(),
  minLevelToPost: z.number().int().min(0).max(17).default(16),
  minLevelToView: z.number().int().min(0).max(17).default(16),
});

export const updateForumSchema = createForumSchema.partial().extend({
  id: z.string().min(1),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateForumInput = z.infer<typeof createForumSchema>;
export type UpdateForumInput = z.infer<typeof updateForumSchema>;
