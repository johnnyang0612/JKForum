import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1, "請輸入標題").max(200, "標題不能超過 200 字"),
  content: z.string().min(1, "請輸入內容").max(50000, "內容不能超過 50000 字"),
  forumId: z.string().min(1, "請選擇看板"),
  subforumId: z.string().optional(),
  visibility: z.enum(["PUBLIC", "REPLY_TO_VIEW", "PAID", "VIP_ONLY", "PRIVATE"]).default("PUBLIC"),
  paidCoins: z.number().int().min(0).default(0),
  tags: z.array(z.string()).max(5, "最多 5 個標籤").default([]),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),
});

export const updatePostSchema = createPostSchema.partial().extend({
  id: z.string().min(1),
});

export const createReplySchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1, "請輸入回覆內容").max(10000, "回覆不能超過 10000 字"),
  parentId: z.string().optional(),
});

export const updateReplySchema = z.object({
  id: z.string().min(1),
  content: z.string().min(1, "請輸入回覆內容").max(10000, "回覆不能超過 10000 字"),
});

export const reportSchema = z.object({
  targetType: z.enum(["POST", "REPLY", "USER"]),
  targetId: z.string().min(1),
  type: z.enum(["PORNOGRAPHY", "VIOLENCE", "SPAM", "HARASSMENT", "MISINFORMATION", "OTHER"]),
  reason: z.string().min(10, "檢舉理由至少 10 字").max(1000, "檢舉理由不能超過 1000 字"),
  evidence: z.string().max(2000).optional(),
});

export const searchSchema = z.object({
  q: z.string().min(1, "請輸入搜尋關鍵字").max(100),
  type: z.enum(["post", "user", "forum"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateReplyInput = z.infer<typeof createReplySchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
