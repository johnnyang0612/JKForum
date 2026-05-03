/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "./db";
import type {
  MineLocation,
  ExploreLocation,
  TreasureType,
} from "@prisma/client";

/**
 * 體力 / 愛心成本表 — 對應 JKF 規格
 */
export const MINE_COST: Record<MineLocation, number> = {
  DRAGON_LAIR: 10,
  ELF_CANYON: 5,
  ABANDONED_MINE: 1,
};

export const EXPLORE_COST: Record<ExploreLocation, number> = {
  FALLEN_SANCTUARY: 10,
  BURNING_LAND: 5,
  GIANT_FOREST: 1,
};

export const TREASURE_COST: Record<TreasureType, number> = {
  GOLD: 10000,
  SILVER: 1000,
  BRONZE: 100,
};

export const LOCATION_LABELS: Record<MineLocation, string> = {
  DRAGON_LAIR: "巨龍巢穴",
  ELF_CANYON: "精靈峽谷",
  ABANDONED_MINE: "廢棄礦坑",
};

export const EXPLORE_LABELS: Record<ExploreLocation, string> = {
  FALLEN_SANCTUARY: "墮落聖地",
  BURNING_LAND: "焚燒之地",
  GIANT_FOREST: "巨木森林",
};

export const TREASURE_LABELS: Record<TreasureType, string> = {
  GOLD: "黃金寶箱",
  SILVER: "白銀寶箱",
  BRONZE: "青銅寶箱",
};

type DropRow = {
  itemId: string;
  weight: number;
  minQty: number;
  maxQty: number;
  item: { slug: string; name: string; iconEmoji: string | null; rarity: string };
};

type DropResult = {
  itemId: string;
  slug: string;
  name: string;
  iconEmoji: string | null;
  rarity: string;
  quantity: number;
};

/**
 * 加權隨機抽 1-3 個道具
 */
function rollDrops(drops: DropRow[], picks: number): DropResult[] {
  if (drops.length === 0) return [];
  const totalWeight = drops.reduce((s, d) => s + d.weight, 0);
  const out: DropResult[] = [];
  for (let i = 0; i < picks; i++) {
    let r = Math.random() * totalWeight;
    for (const d of drops) {
      r -= d.weight;
      if (r <= 0) {
        const qty =
          d.maxQty > d.minQty
            ? d.minQty + Math.floor(Math.random() * (d.maxQty - d.minQty + 1))
            : d.minQty;
        const existing = out.find((x) => x.itemId === d.itemId);
        if (existing) {
          existing.quantity += qty;
        } else {
          out.push({
            itemId: d.itemId,
            slug: d.item.slug,
            name: d.item.name,
            iconEmoji: d.item.iconEmoji,
            rarity: d.item.rarity,
            quantity: qty,
          });
        }
        break;
      }
    }
  }
  return out;
}

/**
 * 寫進使用者背包（增加數量）
 */
async function addToInventory(
  userId: string,
  rewards: Array<{ itemId: string; quantity: number }>
) {
  for (const r of rewards) {
    await db.userGameItem.upsert({
      where: { userId_itemId: { userId, itemId: r.itemId } },
      update: { quantity: { increment: r.quantity } },
      create: { userId, itemId: r.itemId, quantity: r.quantity },
    });
  }
}

/**
 * 扣體力（energy） — 不夠就拋錯
 */
async function spendEnergy(userId: string, cost: number) {
  const points = await db.userPoints.findUnique({ where: { userId } });
  if (!points) throw new Error("用戶積分資料不存在");
  if (points.energy < cost) {
    throw new Error(`體力不足，需 ${cost}，目前 ${points.energy}`);
  }
  await db.userPoints.update({
    where: { userId },
    data: { energy: { decrement: cost } },
  });
}

/**
 * 扣愛心（hearts）
 */
async function spendHearts(userId: string, cost: number) {
  const points = await db.userPoints.findUnique({ where: { userId } });
  if (!points) throw new Error("用戶積分資料不存在");
  if (points.hearts < cost) {
    throw new Error(`愛心不足，需 ${cost}，目前 ${points.hearts}`);
  }
  await db.userPoints.update({
    where: { userId },
    data: { hearts: { decrement: cost } },
  });
}

/**
 * 挖礦
 */
export async function mine(userId: string, location: MineLocation) {
  const cost = MINE_COST[location];
  await spendEnergy(userId, cost);

  const drops = await db.mineDrop.findMany({
    where: { location },
    include: {
      item: { select: { slug: true, name: true, iconEmoji: true, rarity: true } },
    },
  });

  // 高級礦坑挖更多
  const picks = location === "DRAGON_LAIR" ? 3 : location === "ELF_CANYON" ? 2 : 1;
  const rewards = rollDrops(drops as DropRow[], picks);

  await addToInventory(
    userId,
    rewards.map((r) => ({ itemId: r.itemId, quantity: r.quantity }))
  );

  await db.mineSession.create({
    data: {
      userId,
      location,
      energyUsed: cost,
      rewards: rewards as any,
    },
  });

  return { rewards, energyUsed: cost };
}

/**
 * 地形探索
 */
export async function explore(userId: string, location: ExploreLocation) {
  const cost = EXPLORE_COST[location];
  await spendEnergy(userId, cost);

  const drops = await db.exploreDrop.findMany({
    where: { location },
    include: {
      item: { select: { slug: true, name: true, iconEmoji: true, rarity: true } },
    },
  });

  const picks =
    location === "FALLEN_SANCTUARY" ? 3 : location === "BURNING_LAND" ? 2 : 1;
  const rewards = rollDrops(drops as DropRow[], picks);

  await addToInventory(
    userId,
    rewards.map((r) => ({ itemId: r.itemId, quantity: r.quantity }))
  );

  await db.exploreSession.create({
    data: {
      userId,
      location,
      energyUsed: cost,
      rewards: rewards as any,
    },
  });

  return { rewards, energyUsed: cost };
}

/**
 * 開寶箱
 */
export async function openTreasure(userId: string, treasure: TreasureType) {
  const cost = TREASURE_COST[treasure];
  await spendHearts(userId, cost);

  const drops = await db.treasureDrop.findMany({
    where: { treasure },
    include: {
      item: { select: { slug: true, name: true, iconEmoji: true, rarity: true } },
    },
  });

  const picks = treasure === "GOLD" ? 5 : treasure === "SILVER" ? 3 : 2;
  const rewards = rollDrops(drops as DropRow[], picks);

  await addToInventory(
    userId,
    rewards.map((r) => ({ itemId: r.itemId, quantity: r.quantity }))
  );

  await db.treasureSession.create({
    data: {
      userId,
      treasure,
      heartsUsed: cost,
      rewards: rewards as any,
    },
  });

  return { rewards, heartsUsed: cost };
}

/**
 * 商店：購買道具（用 coins / hearts / gems）
 */
export async function buyItem(userId: string, itemSlug: string, qty = 1) {
  const item = await db.gameItem.findUnique({ where: { slug: itemSlug } });
  if (!item || !item.isActive) throw new Error("道具不存在或下架");
  if (item.priceCoins == null && item.priceHearts == null && item.priceGems == null) {
    throw new Error("此道具不可購買");
  }
  const points = await db.userPoints.findUnique({ where: { userId } });
  if (!points) throw new Error("用戶積分資料不存在");

  const totalCoins = (item.priceCoins ?? 0) * qty;
  const totalHearts = (item.priceHearts ?? 0) * qty;
  const totalGems = (item.priceGems ?? 0) * qty;

  if (totalCoins > 0 && points.coins < totalCoins)
    throw new Error(`金幣不足，需 ${totalCoins}`);
  if (totalHearts > 0 && points.hearts < totalHearts)
    throw new Error(`愛心不足，需 ${totalHearts}`);
  if (totalGems > 0 && points.gems < totalGems)
    throw new Error(`寶石不足，需 ${totalGems}`);

  await db.userPoints.update({
    where: { userId },
    data: {
      coins: { decrement: totalCoins },
      hearts: { decrement: totalHearts },
      gems: { decrement: totalGems },
    },
  });

  // 頭框類道具 — 自動套用到 User.avatarFrame（不進背包，直接改 user 設定）
  if (item.slug.startsWith("frame-")) {
    const frameKey = item.slug.replace("frame-", ""); // gold/silver/bronze/purple/green
    await db.user.update({
      where: { id: userId },
      data: { avatarFrame: frameKey },
    });
    return { item, qty, spent: { totalCoins, totalHearts, totalGems }, appliedFrame: frameKey };
  }

  await addToInventory(userId, [{ itemId: item.id, quantity: qty }]);

  return { item, qty, spent: { totalCoins, totalHearts, totalGems } };
}

/**
 * 合成：消耗背包道具 + 金幣 + 體力 → 產出新道具
 */
export async function craftItem(userId: string, recipeId: string) {
  const recipe = await db.itemRecipe.findUnique({
    where: { id: recipeId },
    include: {
      output: true,
      ingredients: { include: { item: true } },
    },
  });
  if (!recipe || !recipe.isActive) throw new Error("配方不存在");

  const points = await db.userPoints.findUnique({ where: { userId } });
  if (!points) throw new Error("用戶積分資料不存在");
  if (points.coins < recipe.costCoins)
    throw new Error(`金幣不足，需 ${recipe.costCoins}`);
  if (points.energy < recipe.costEnergy)
    throw new Error(`體力不足，需 ${recipe.costEnergy}`);

  // 檢查所有材料庫存
  for (const ing of recipe.ingredients) {
    const stock = await db.userGameItem.findUnique({
      where: { userId_itemId: { userId, itemId: ing.itemId } },
    });
    if (!stock || stock.quantity < ing.quantity) {
      throw new Error(
        `材料不足：${ing.item.name} 需 ${ing.quantity}，目前 ${stock?.quantity ?? 0}`
      );
    }
  }

  // 扣材料
  for (const ing of recipe.ingredients) {
    await db.userGameItem.update({
      where: { userId_itemId: { userId, itemId: ing.itemId } },
      data: { quantity: { decrement: ing.quantity } },
    });
  }
  // 扣金幣 / 體力
  await db.userPoints.update({
    where: { userId },
    data: {
      coins: { decrement: recipe.costCoins },
      energy: { decrement: recipe.costEnergy },
    },
  });
  // 產出
  await addToInventory(userId, [
    { itemId: recipe.outputId, quantity: recipe.outputCount },
  ]);

  return { output: recipe.output, count: recipe.outputCount };
}

/**
 * 勳章合成：消耗多個小勳章 → 換大勳章
 */
export async function craftMedal(userId: string, medalRecipeId: string) {
  const recipe = await db.medalRecipe.findUnique({
    where: { id: medalRecipeId },
  });
  if (!recipe || !recipe.isActive) throw new Error("勳章配方不存在");

  const ingredients = recipe.ingredients as Array<{
    medalSlug: string;
    quantity: number;
  }>;

  const points = await db.userPoints.findUnique({ where: { userId } });
  if (!points) throw new Error("用戶積分資料不存在");
  if (points.coins < recipe.costCoins)
    throw new Error(`金幣不足，需 ${recipe.costCoins}`);

  // 檢查所有勳章庫存（用 UserMedal 的數量？ JKF 是有重複勳章的）
  // 簡化：UserMedal 是 unique 持有，這裡改用 PointHistory 記錄「持有 N 枚」邏輯
  // TODO: 嚴謹版需要 UserMedalQuantity 模型；目前先檢查是否擁有該 slug
  for (const ing of ingredients) {
    const medal = await db.medal.findUnique({ where: { slug: ing.medalSlug } });
    if (!medal) throw new Error(`勳章不存在：${ing.medalSlug}`);
    const owned = await db.userMedal.findUnique({
      where: { userId_medalId: { userId, medalId: medal.id } },
    });
    if (!owned) throw new Error(`未持有勳章：${medal.name}`);
  }

  await db.userPoints.update({
    where: { userId },
    data: { coins: { decrement: recipe.costCoins } },
  });

  // 直接發放輸出勳章
  const out = await db.medal.findUnique({ where: { slug: recipe.outputSlug } });
  if (!out) throw new Error("輸出勳章不存在");
  await db.userMedal.upsert({
    where: { userId_medalId: { userId, medalId: out.id } },
    update: {},
    create: { userId, medalId: out.id, note: "合成獲得" },
  });

  return { medal: out };
}

/**
 * 賣出道具 — 50% 原價回收（沒商店價的稀有道具按 rarity 預設值）
 */
const RARITY_BASE_PRICE: Record<string, number> = {
  COMMON: 10,
  UNCOMMON: 30,
  RARE: 80,
  EPIC: 200,
  LEGENDARY: 500,
};

export async function sellItem(userId: string, itemSlug: string, qty = 1) {
  const item = await db.gameItem.findUnique({ where: { slug: itemSlug } });
  if (!item) throw new Error("道具不存在");
  const stock = await db.userGameItem.findUnique({
    where: { userId_itemId: { userId, itemId: item.id } },
  });
  if (!stock || stock.quantity < qty) {
    throw new Error(`庫存不足，目前 ${stock?.quantity ?? 0}`);
  }
  // 計算回收價（商店價 50%，沒商店價用 rarity 預設）
  const baseCoins = item.priceCoins ?? RARITY_BASE_PRICE[item.rarity] ?? 5;
  const sellCoins = Math.max(1, Math.floor(baseCoins * 0.5));
  const totalCoins = sellCoins * qty;

  // 扣道具
  if (stock.quantity === qty) {
    await db.userGameItem.delete({
      where: { userId_itemId: { userId, itemId: item.id } },
    });
  } else {
    await db.userGameItem.update({
      where: { userId_itemId: { userId, itemId: item.id } },
      data: { quantity: { decrement: qty } },
    });
  }

  // 加金幣
  await db.userPoints.update({
    where: { userId },
    data: { coins: { increment: totalCoins } },
  });

  return { sold: qty, item, coinsEarned: totalCoins };
}

/**
 * 用愛心換體力 — 10 hearts = 1 energy（VIP 上限 200，一般 100）
 */
export async function exchangeHeartsToEnergy(userId: string, energyAmount: number) {
  if (energyAmount < 1 || energyAmount > 100) {
    throw new Error("一次最多換 100 點體力");
  }
  const heartsCost = energyAmount * 10;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { userGroup: true, points: true },
  });
  if (!user?.points) throw new Error("用戶積分資料不存在");
  if (user.points.hearts < heartsCost) {
    throw new Error(`愛心不足，需 ${heartsCost}`);
  }
  const cap = user.userGroup === "VIP" ? 200 : 100;
  const finalEnergy = Math.min(cap, user.points.energy + energyAmount);
  const actualGain = finalEnergy - user.points.energy;
  if (actualGain <= 0) {
    throw new Error(`體力已達上限 ${cap}`);
  }
  const actualCost = actualGain * 10;
  await db.userPoints.update({
    where: { userId },
    data: {
      hearts: { decrement: actualCost },
      energy: finalEnergy,
    },
  });
  return { energyGained: actualGain, heartsSpent: actualCost, currentEnergy: finalEnergy, cap };
}

/**
 * 贈送道具給好友
 */
export async function giftItem(fromUserId: string, toUsername: string, itemSlug: string, qty = 1) {
  const toUser = await db.user.findUnique({ where: { username: toUsername } });
  if (!toUser) throw new Error("收件人不存在");
  if (toUser.id === fromUserId) throw new Error("不能送給自己");
  const item = await db.gameItem.findUnique({ where: { slug: itemSlug } });
  if (!item) throw new Error("道具不存在");
  const stock = await db.userGameItem.findUnique({
    where: { userId_itemId: { userId: fromUserId, itemId: item.id } },
  });
  if (!stock || stock.quantity < qty) {
    throw new Error(`庫存不足，目前 ${stock?.quantity ?? 0}`);
  }
  // 扣寄件人
  if (stock.quantity === qty) {
    await db.userGameItem.delete({
      where: { userId_itemId: { userId: fromUserId, itemId: item.id } },
    });
  } else {
    await db.userGameItem.update({
      where: { userId_itemId: { userId: fromUserId, itemId: item.id } },
      data: { quantity: { decrement: qty } },
    });
  }
  // 加收件人
  await db.userGameItem.upsert({
    where: { userId_itemId: { userId: toUser.id, itemId: item.id } },
    create: { userId: toUser.id, itemId: item.id, quantity: qty },
    update: { quantity: { increment: qty } },
  });
  return { item, qty, toUser: { username: toUser.username, displayName: toUser.displayName } };
}

export async function getInventory(userId: string) {
  return db.userGameItem.findMany({
    where: { userId, quantity: { gt: 0 } },
    include: { item: true },
    orderBy: { item: { category: "asc" } },
  });
}

export async function getStorefrontItems() {
  return db.gameItem.findMany({
    where: {
      isActive: true,
      OR: [
        { priceCoins: { not: null } },
        { priceHearts: { not: null } },
        { priceGems: { not: null } },
      ],
    },
    orderBy: [{ category: "asc" }, { priceCoins: "asc" }],
  });
}

export async function getRecipes() {
  return db.itemRecipe.findMany({
    where: { isActive: true },
    include: {
      output: true,
      ingredients: { include: { item: true } },
    },
  });
}

export async function getMedalRecipes() {
  return db.medalRecipe.findMany({ where: { isActive: true } });
}
