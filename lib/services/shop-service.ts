import { db } from "@/lib/db";
import { PointType, PointChangeReason, ShopItemType } from "@prisma/client";

/**
 * 取得商城道具列表
 */
export async function getShopItems(type?: ShopItemType) {
  return db.shopItem.findMany({
    where: {
      isActive: true,
      ...(type ? { type } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

/**
 * 取得單一道具詳情
 */
export async function getShopItem(itemId: string) {
  return db.shopItem.findUnique({
    where: { id: itemId },
  });
}

/**
 * 購買道具
 */
export async function purchaseItem(userId: string, itemId: string) {
  const item = await db.shopItem.findUnique({
    where: { id: itemId },
  });

  if (!item) {
    return { error: "找不到該道具" };
  }

  if (!item.isActive) {
    return { error: "該道具已下架" };
  }

  // 查詢用戶積分
  const userPoints = await db.userPoints.findUnique({
    where: { userId },
  });

  if (!userPoints) {
    return { error: "找不到用戶積分資料" };
  }

  // 檢查餘額
  const currencyField = item.currency === PointType.COINS ? "coins" : "platinum";
  const currencyName = item.currency === PointType.COINS ? "金幣" : "白金幣";

  if (userPoints[currencyField] < item.price) {
    return {
      error: `${currencyName}不足，需要 ${item.price} ${currencyName}，目前只有 ${userPoints[currencyField]} ${currencyName}`,
    };
  }

  // 計算過期時間
  const expiresAt = item.duration
    ? new Date(Date.now() + item.duration * 60 * 60 * 1000)
    : null;

  // 執行交易：扣款 + 添加道具
  const [userItem] = await db.$transaction([
    db.userItem.create({
      data: {
        userId,
        itemId: item.id,
        quantity: 1,
        expiresAt,
      },
    }),
    db.userPoints.update({
      where: { userId },
      data: {
        [currencyField]: { decrement: item.price },
        ...(item.currency === PointType.COINS
          ? { totalPoints: { decrement: item.price } }
          : {}),
      },
    }),
    db.pointHistory.create({
      data: {
        userId,
        type: item.currency,
        amount: -item.price,
        reason: PointChangeReason.ADMIN_ADJUST, // 使用最接近的理由
        detail: `購買道具：${item.name}`,
      },
    }),
  ]);

  return { success: true, userItem };
}

/**
 * 取得用戶道具庫存
 */
export async function getUserItems(userId: string) {
  return db.userItem.findMany({
    where: {
      userId,
      OR: [
        { usedAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      item: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * 取得用戶所有道具（包含已使用/過期）
 */
export async function getUserAllItems(userId: string) {
  return db.userItem.findMany({
    where: { userId },
    include: { item: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * 使用道具
 */
export async function useItem(
  userId: string,
  userItemId: string,
  targetId?: string
) {
  const userItem = await db.userItem.findFirst({
    where: {
      id: userItemId,
      userId,
      usedAt: null,
    },
    include: { item: true },
  });

  if (!userItem) {
    return { error: "找不到該道具或已被使用" };
  }

  // 檢查是否過期
  if (userItem.expiresAt && userItem.expiresAt < new Date()) {
    return { error: "該道具已過期" };
  }

  // 根據道具類型套用效果
  const now = new Date();

  switch (userItem.item.type) {
    case "BOOST":
      if (!targetId) {
        return { error: "使用加成道具需要指定目標文章" };
      }
      await applyBoostEffect(userItem.item.id, targetId, userItem.item.duration);
      break;
    case "BADGE":
      // 勳章類型不需要額外動作，購買即擁有
      break;
    case "FEATURE":
      // 功能解鎖類型
      break;
  }

  // 標記已使用
  await db.userItem.update({
    where: { id: userItemId },
    data: { usedAt: now },
  });

  return { success: true, message: `成功使用「${userItem.item.name}」` };
}

/**
 * 套用加成效果到文章
 */
async function applyBoostEffect(
  itemId: string,
  postId: string,
  duration: number | null
) {
  const post = await db.post.findUnique({ where: { id: postId } });
  if (!post) return;

  // 根據道具 ID 判斷效果
  if (itemId === "item_boost_pin") {
    await db.post.update({
      where: { id: postId },
      data: {
        isPinned: true,
        pinnedAt: new Date(),
      },
    });
  } else if (itemId === "item_boost_highlight") {
    await db.post.update({
      where: { id: postId },
      data: {
        isHighlighted: true,
        highlightColor: "#FFD700",
      },
    });
  }
  // 加速卡不需要套用到文章
}
