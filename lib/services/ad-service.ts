import { db } from "@/lib/db";
import { AdPosition } from "@prisma/client";

/**
 * 取得指定位置的有效廣告
 * 可選擇性依看板 ID 篩選
 */
export async function getAdsForPosition(
  position: AdPosition,
  forumId?: string
) {
  const now = new Date();

  const ads = await db.advertisement.findMany({
    where: {
      position,
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { priority: "desc" },
  });

  // 篩選目標看板
  if (forumId) {
    return ads.filter((ad) => {
      if (!ad.targetForums) return true; // null = 全部看板
      try {
        const targets: string[] = JSON.parse(ad.targetForums);
        return targets.length === 0 || targets.includes(forumId);
      } catch {
        return true;
      }
    });
  }

  return ads;
}

/**
 * 記錄曝光次數
 */
export async function trackImpression(adId: string) {
  try {
    await db.advertisement.update({
      where: { id: adId },
      data: { impressions: { increment: 1 } },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * 記錄點擊次數
 */
export async function trackClick(adId: string) {
  try {
    await db.advertisement.update({
      where: { id: adId },
      data: { clicks: { increment: 1 } },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * 取得廣告統計資料（含 CTR）
 */
export async function getAdStats(adId: string) {
  const ad = await db.advertisement.findUnique({
    where: { id: adId },
    select: {
      id: true,
      title: true,
      impressions: true,
      clicks: true,
      startDate: true,
      endDate: true,
      isActive: true,
    },
  });

  if (!ad) return null;

  const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;

  const now = new Date();
  const totalDays = Math.max(
    1,
    Math.ceil(
      (ad.endDate.getTime() - ad.startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  );
  const elapsedDays = Math.max(
    1,
    Math.ceil(
      (Math.min(now.getTime(), ad.endDate.getTime()) -
        ad.startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const dailyImpressions =
    elapsedDays > 0 ? Math.round(ad.impressions / elapsedDays) : 0;
  const dailyClicks =
    elapsedDays > 0 ? Math.round(ad.clicks / elapsedDays) : 0;

  return {
    ...ad,
    ctr: Math.round(ctr * 100) / 100,
    totalDays,
    elapsedDays,
    dailyImpressions,
    dailyClicks,
  };
}

/**
 * 取得所有廣告列表（管理用）
 */
export async function getAllAds(page: number = 1, limit: number = 20) {
  const [ads, total] = await Promise.all([
    db.advertisement.findMany({
      orderBy: [{ isActive: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.advertisement.count(),
  ]);

  return { ads, total, totalPages: Math.ceil(total / limit) };
}
