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

export async function resolveReport(reportId: string, resolution: string) {
  const admin = await requireAdmin();

  try {
    await db.report.update({
      where: { id: reportId },
      data: {
        status: "RESOLVED",
        resolution,
        resolvedBy: admin.id,
        resolvedAt: new Date(),
      },
    });

    await logAdminAction(admin.id, "REPORT_RESOLVE", "Report", reportId, resolution);

    revalidatePath("/admin/reports");
    return { success: true };
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
