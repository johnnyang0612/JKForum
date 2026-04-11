"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { AdPosition } from "@prisma/client";

const VALID_POSITIONS = new Set<string>([
  "HOME_BANNER",
  "SIDEBAR",
  "POST_INLINE",
  "OVERLAY",
  "POPUP",
]);

export async function createAd(formData: FormData) {
  await requireAdmin();

  const title = (formData.get("title") as string)?.trim();
  const imageUrl = (formData.get("imageUrl") as string)?.trim();
  const linkUrl = (formData.get("linkUrl") as string)?.trim();
  const position = formData.get("position") as string;
  const width = formData.get("width") ? Number(formData.get("width")) : null;
  const height = formData.get("height") ? Number(formData.get("height")) : null;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const priority = Number(formData.get("priority") || 0);
  const targetForums = (formData.get("targetForums") as string)?.trim() || null;

  // 驗證
  if (!title) return { error: "請輸入廣告標題" };
  if (!imageUrl) return { error: "請輸入圖片網址" };
  if (!linkUrl) return { error: "請輸入連結網址" };
  if (!position || !VALID_POSITIONS.has(position)) return { error: "請選擇有效的廣告位置" };
  if (!startDate || !endDate) return { error: "請設定開始和結束日期" };

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) return { error: "結束日期必須晚於開始日期" };

  try {
    await db.advertisement.create({
      data: {
        title,
        imageUrl,
        linkUrl,
        position: position as AdPosition,
        width,
        height,
        startDate: start,
        endDate: end,
        priority,
        targetForums: targetForums || null,
        isActive: true,
      },
    });

    revalidatePath("/admin/ads");
    return { success: true };
  } catch {
    return { error: "建立廣告失敗" };
  }
}

export async function updateAd(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  if (!id) return { error: "缺少廣告 ID" };

  const title = (formData.get("title") as string)?.trim();
  const imageUrl = (formData.get("imageUrl") as string)?.trim();
  const linkUrl = (formData.get("linkUrl") as string)?.trim();
  const position = formData.get("position") as string;
  const width = formData.get("width") ? Number(formData.get("width")) : null;
  const height = formData.get("height") ? Number(formData.get("height")) : null;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const priority = Number(formData.get("priority") || 0);
  const targetForums = (formData.get("targetForums") as string)?.trim() || null;
  const isActive = formData.get("isActive") === "true";

  // 驗證
  if (!title) return { error: "請輸入廣告標��" };
  if (!imageUrl) return { error: "請輸入圖片網址" };
  if (!linkUrl) return { error: "請輸入連結網址" };
  if (!position || !VALID_POSITIONS.has(position)) return { error: "請選擇有效的廣告位置" };
  if (!startDate || !endDate) return { error: "請設定開始和結束日期" };

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) return { error: "結束日期必須晚於開始日期" };

  try {
    await db.advertisement.update({
      where: { id },
      data: {
        title,
        imageUrl,
        linkUrl,
        position: position as AdPosition,
        width,
        height,
        startDate: start,
        endDate: end,
        priority,
        targetForums: targetForums || null,
        isActive,
      },
    });

    revalidatePath("/admin/ads");
    revalidatePath(`/admin/ads/${id}`);
    return { success: true };
  } catch {
    return { error: "更新廣���失敗" };
  }
}

export async function deleteAd(adId: string) {
  await requireAdmin();

  try {
    await db.advertisement.delete({ where: { id: adId } });

    revalidatePath("/admin/ads");
    return { success: true };
  } catch {
    return { error: "刪除��告失敗" };
  }
}

export async function toggleAdStatus(adId: string) {
  await requireAdmin();

  try {
    const ad = await db.advertisement.findUnique({
      where: { id: adId },
      select: { isActive: true },
    });

    if (!ad) return { error: "廣告不存在" };

    await db.advertisement.update({
      where: { id: adId },
      data: { isActive: !ad.isActive },
    });

    revalidatePath("/admin/ads");
    return { success: true };
  } catch {
    return { error: "操作失敗" };
  }
}
