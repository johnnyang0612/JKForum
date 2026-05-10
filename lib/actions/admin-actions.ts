"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { adminAdjustPoints } from "@/lib/services/points-service";
import { notifySystem } from "@/lib/services/notification-service";
import { PointType, AdminActionType } from "@prisma/client";

async function logAdminAction(
  adminId: string,
  action: AdminActionType,
  targetType: string,
  targetId: string,
  detail?: string
) {
  await db.adminLog.create({
    data: { adminId, action, targetType, targetId, detail },
  });
}

export async function banUser(userId: string, reason?: string) {
  const admin = await requireAdmin();

  try {
    await db.user.update({
      where: { id: userId },
      data: { status: "BANNED" },
    });

    await logAdminAction(admin.id, "USER_BAN", "User", userId, reason);
    await notifySystem(userId, "帳號已被封鎖", reason || "違反社群規範");

    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { error: "操作失敗" };
  }
}

export async function unbanUser(userId: string) {
  const admin = await requireAdmin();

  try {
    await db.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" },
    });

    await logAdminAction(admin.id, "USER_UNBAN", "User", userId);
    await notifySystem(userId, "帳號已解除封鎖", "您的帳號已恢復正常使用");

    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { error: "操作失敗" };
  }
}

export async function muteUser(userId: string, reason?: string) {
  const admin = await requireAdmin();

  try {
    await db.user.update({
      where: { id: userId },
      data: { status: "MUTED" },
    });

    await logAdminAction(admin.id, "USER_MUTE", "User", userId, reason);
    await notifySystem(userId, "帳號已被禁言", reason || "違反社群規範");

    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { error: "操作失敗" };
  }
}

export async function unmuteUser(userId: string) {
  const admin = await requireAdmin();

  try {
    await db.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" },
    });

    await logAdminAction(admin.id, "USER_UNMUTE", "User", userId);

    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { error: "操作失敗" };
  }
}

export async function deletePostAdmin(postId: string, reason?: string) {
  const admin = await requireAdmin();

  try {
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { authorId: true, title: true, forumId: true },
    });

    if (!post) return { error: "文章不存在" };

    await db.post.update({
      where: { id: postId },
      data: { status: "DELETED" },
    });

    await db.forum.update({
      where: { id: post.forumId },
      data: { postCount: { decrement: 1 } },
    });

    await logAdminAction(admin.id, "POST_DELETE", "Post", postId, reason);
    await notifySystem(
      post.authorId,
      "您的文章已被刪除",
      `「${post.title}」因 ${reason || "違反規範"} 已被管理員刪除`
    );

    revalidatePath("/admin/posts");
    return { success: true };
  } catch {
    return { error: "操作失敗" };
  }
}

// 解析檢舉的「被檢舉用戶」ID（按 targetType 拿正確的對象）
async function resolveReportTargetUserId(reportId: string): Promise<string | null> {
  const r = await db.report.findUnique({
    where: { id: reportId },
    select: { targetType: true, targetId: true },
  });
  if (!r) return null;
  if (r.targetType === "USER") return r.targetId;
  if (r.targetType === "POST") {
    const p = await db.post.findUnique({ where: { id: r.targetId }, select: { authorId: true } });
    return p?.authorId ?? null;
  }
  if (r.targetType === "REPLY") {
    const re = await db.reply.findUnique({ where: { id: r.targetId }, select: { authorId: true } });
    return re?.authorId ?? null;
  }
  return null;
}

// 將檢舉處理 + 同時對被檢舉內容/用戶執行懲罰
export async function resolveReport(
  reportId: string,
  resolution: string,
  punish?: { removeContent?: boolean; banTarget?: boolean; muteTarget?: boolean; deductPoints?: number }
) {
  const admin = await requireAdmin();

  try {
    const r = await db.report.findUnique({ where: { id: reportId } });
    if (!r) return { error: "檢舉不存在" };

    const punishment: string[] = [];

    if (punish?.removeContent) {
      if (r.targetType === "POST") {
        await db.post.update({ where: { id: r.targetId }, data: { status: "DELETED" } });
        punishment.push("已刪除被檢舉貼文");
      } else if (r.targetType === "REPLY") {
        const reply = await db.reply.findUnique({ where: { id: r.targetId }, select: { postId: true } });
        if (reply) {
          await db.reply.update({ where: { id: r.targetId }, data: { status: "DELETED" } });
          await db.post.update({
            where: { id: reply.postId },
            data: { replyCount: { decrement: 1 } },
          });
        }
        punishment.push("已刪除被檢舉留言");
      }
    }

    const targetUserId = await resolveReportTargetUserId(reportId);
    if (punish?.banTarget && targetUserId) {
      await db.user.update({
        where: { id: targetUserId },
        data: { status: "BANNED", sessionVersion: { increment: 1 } },
      });
      punishment.push(`已封鎖 ${targetUserId}`);
    } else if (punish?.muteTarget && targetUserId) {
      await db.user.update({ where: { id: targetUserId }, data: { status: "MUTED" } });
      punishment.push(`已禁言 ${targetUserId}`);
    }

    if (punish?.deductPoints && targetUserId && punish.deductPoints > 0) {
      try {
        await adminAdjustPoints(
          targetUserId,
          PointType.REPUTATION,
          -Math.abs(punish.deductPoints),
          `違規扣分（檢舉 ${reportId}）`
        );
        punishment.push(`扣 ${punish.deductPoints} 點名聲`);
      } catch {
        /* noop */
      }
    }

    const fullResolution = punishment.length > 0
      ? `${resolution}｜${punishment.join("、")}`
      : resolution;

    await db.report.update({
      where: { id: reportId },
      data: {
        status: "RESOLVED",
        resolution: fullResolution,
        resolvedBy: admin.id,
        resolvedAt: new Date(),
      },
    });

    await logAdminAction(admin.id, "REPORT_RESOLVE", "Report", reportId, fullResolution);

    revalidatePath("/admin/reports");
    return { success: true, punishment };
  } catch {
    return { error: "操作失敗" };
  }
}

// 修正版：依檢舉的 targetType 正確封鎖被檢舉者（不會誤封檢舉人）
export async function banReportTarget(reportId: string, reason?: string) {
  const admin = await requireAdmin();
  try {
    const targetUserId = await resolveReportTargetUserId(reportId);
    if (!targetUserId) return { error: "找不到被檢舉用戶" };
    if (targetUserId === admin.id) return { error: "不能封鎖自己" };

    await db.user.update({
      where: { id: targetUserId },
      data: { status: "BANNED", sessionVersion: { increment: 1 } },
    });
    await logAdminAction(admin.id, "USER_BAN", "User", targetUserId, `Report ${reportId}: ${reason ?? "違反社群規範"}`);
    revalidatePath("/admin/reports");
    revalidatePath(`/admin/users/${targetUserId}`);
    return { success: true, bannedUserId: targetUserId };
  } catch {
    return { error: "操作失敗" };
  }
}

export async function dismissReport(reportId: string) {
  const admin = await requireAdmin();

  try {
    await db.report.update({
      where: { id: reportId },
      data: {
        status: "DISMISSED",
        resolvedBy: admin.id,
        resolvedAt: new Date(),
      },
    });

    await logAdminAction(admin.id, "REPORT_DISMISS", "Report", reportId);

    revalidatePath("/admin/reports");
    return { success: true };
  } catch {
    return { error: "操作失敗" };
  }
}

export async function adjustPoints(
  userId: string,
  type: "REPUTATION" | "COINS" | "PLATINUM",
  amount: number,
  detail: string
) {
  const admin = await requireAdmin();

  try {
    await adminAdjustPoints(userId, type as PointType, amount, detail);
    await logAdminAction(admin.id, "POINTS_ADJUST", "User", userId, `${type} ${amount > 0 ? "+" : ""}${amount}: ${detail}`);

    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch {
    return { error: "操作失敗" };
  }
}

export async function createForum(formData: FormData) {
  const admin = await requireAdmin();

  const data = {
    categoryId: formData.get("categoryId") as string,
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    description: (formData.get("description") as string) || undefined,
    rules: (formData.get("rules") as string) || undefined,
    minLevelToPost: Number(formData.get("minLevelToPost") || 16),
    minLevelToView: Number(formData.get("minLevelToView") || 16),
  };

  try {
    const forum = await db.forum.create({ data });
    await logAdminAction(admin.id, "FORUM_CREATE", "Forum", forum.id, data.name);

    revalidatePath("/admin/forums");
    revalidatePath("/forums");
    return { success: true, forumId: forum.id };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return { error: "看板代稱已存在" };
    }
    return { error: "建立看板失敗" };
  }
}

export async function updateForum(formData: FormData) {
  const admin = await requireAdmin();

  const id = formData.get("id") as string;
  const data: Record<string, unknown> = {};

  const name = formData.get("name") as string;
  if (name) data.name = name;
  const description = formData.get("description") as string;
  if (description !== null) data.description = description;
  const rules = formData.get("rules") as string;
  if (rules !== null) data.rules = rules;
  const minLevelToPost = formData.get("minLevelToPost");
  if (minLevelToPost) data.minLevelToPost = Number(minLevelToPost);
  const minLevelToView = formData.get("minLevelToView");
  if (minLevelToView) data.minLevelToView = Number(minLevelToView);
  const isVisible = formData.get("isVisible");
  if (isVisible !== null) data.isVisible = isVisible === "true";
  const isLocked = formData.get("isLocked");
  if (isLocked !== null) data.isLocked = isLocked === "true";
  const ageGateEnabled = formData.get("ageGateEnabled");
  if (ageGateEnabled !== null) data.ageGateEnabled = ageGateEnabled === "true";
  const rating = formData.get("rating");
  if (rating && ["G", "PG13", "R18"].includes(String(rating))) {
    data.rating = String(rating);
  }
  const sortOrderRaw = formData.get("sortOrder");
  if (sortOrderRaw !== null && sortOrderRaw !== "") {
    const n = Number(sortOrderRaw);
    if (Number.isFinite(n) && n >= 0) data.sortOrder = n;
  }

  // PRD-0503: 業者付費刊登開關
  const allowPaidListing = formData.get("allowPaidListing");
  if (allowPaidListing !== null) data.allowPaidListing = allowPaidListing === "true";
  const defaultAdTier = formData.get("defaultAdTier");
  if (defaultAdTier !== null && defaultAdTier !== "") data.defaultAdTier = defaultAdTier as string;
  const themeCategoriesRaw = formData.get("themeCategoriesRaw");
  if (themeCategoriesRaw !== null) {
    data.themeCategoriesJson = String(themeCategoriesRaw)
      .split(/[,，\s]+/).map(s => s.trim()).filter(Boolean).slice(0, 20);
  }
  const forceThemeCategory = formData.get("forceThemeCategory");
  if (forceThemeCategory !== null) data.forceThemeCategory = forceThemeCategory === "true";

  // 置頂上限
  const maxPinnedPostsRaw = formData.get("maxPinnedPosts");
  if (maxPinnedPostsRaw !== null && maxPinnedPostsRaw !== "") {
    const n = Number(maxPinnedPostsRaw);
    if (Number.isFinite(n) && n >= 0 && n <= 10) data.maxPinnedPosts = n;
  }

  // 進階搜尋 filter — 解析 JSON + 驗證 schema
  const advancedFiltersRaw = formData.get("advancedFiltersRaw");
  if (advancedFiltersRaw !== null) {
    const text = String(advancedFiltersRaw).trim();
    if (text === "" || text === "[]") {
      data.advancedFiltersJson = [];
    } else {
      try {
        const parsed = JSON.parse(text);
        const { safeParseFilterDefs } = await import("@/lib/advanced-filters");
        const valid = safeParseFilterDefs(parsed);
        data.advancedFiltersJson = valid;
      } catch {
        return { error: "進階搜尋 filter 不是合法 JSON" };
      }
    }
  }

  try {
    await db.forum.update({ where: { id }, data });
    await logAdminAction(admin.id, "FORUM_EDIT", "Forum", id);

    revalidatePath("/admin/forums");
    revalidatePath("/forums");
    return { success: true };
  } catch {
    return { error: "更新看板失敗" };
  }
}

export async function deleteForum(forumId: string) {
  const admin = await requireAdmin();

  try {
    await db.forum.delete({ where: { id: forumId } });
    await logAdminAction(admin.id, "FORUM_DELETE", "Forum", forumId);

    revalidatePath("/admin/forums");
    revalidatePath("/forums");
    return { success: true };
  } catch {
    return { error: "刪除看板失敗" };
  }
}

// Quick toggle 顯示/隱藏 / 鎖定（列表頁直接切，免進編輯頁）
export async function toggleForumVisibility(forumId: string) {
  const admin = await requireAdmin();
  try {
    const forum = await db.forum.findUnique({ where: { id: forumId }, select: { isVisible: true } });
    if (!forum) return { error: "看板不存在" };
    const next = !forum.isVisible;
    await db.forum.update({ where: { id: forumId }, data: { isVisible: next } });
    await logAdminAction(admin.id, "SETTINGS_CHANGE", "Forum", forumId, `isVisible→${next}`);
    revalidatePath("/admin/forums");
    revalidatePath("/forums");
    return { success: true, isVisible: next };
  } catch {
    return { error: "切換失敗" };
  }
}

export async function toggleForumLocked(forumId: string) {
  const admin = await requireAdmin();
  try {
    const forum = await db.forum.findUnique({ where: { id: forumId }, select: { isLocked: true } });
    if (!forum) return { error: "看板不存在" };
    const next = !forum.isLocked;
    await db.forum.update({ where: { id: forumId }, data: { isLocked: next } });
    await logAdminAction(admin.id, "SETTINGS_CHANGE", "Forum", forumId, `isLocked→${next}`);
    revalidatePath("/admin/forums");
    return { success: true, isLocked: next };
  } catch {
    return { error: "切換失敗" };
  }
}
