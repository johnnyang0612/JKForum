/**
 * Seed Game Center: items, recipes, mine drops, explore drops, treasure drops, medal recipes.
 * Idempotent: uses upsert by slug.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type ItemSeed = {
  slug: string;
  name: string;
  description?: string;
  category:
    | "TOOL"
    | "AURA"
    | "GEM"
    | "WOOD"
    | "CHARM"
    | "MATERIAL"
    | "POTION"
    | "TROPHY"
    | "RARE";
  rarity?: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
  iconEmoji?: string;
  priceCoins?: number | null;
  priceHearts?: number | null;
  priceGems?: number | null;
};

const ITEMS: ItemSeed[] = [
  // 工具
  { slug: "magnifier", name: "放大鏡", category: "TOOL", iconEmoji: "🔍", priceCoins: 90 },
  { slug: "grinding-drill", name: "研磨鑽", category: "TOOL", iconEmoji: "🪛", priceCoins: 960 },
  { slug: "tree-cutter", name: "割樹刀", category: "TOOL", iconEmoji: "🪓", priceCoins: 960 },
  { slug: "sense-crystal", name: "感應水晶", category: "TOOL", rarity: "RARE", iconEmoji: "💠", priceCoins: 9600 },
  { slug: "tree-codex", name: "樹木圖鑑", category: "TOOL", iconEmoji: "📖", priceCoins: 270 },
  // 幸運符咒
  { slug: "charm-s", name: "幸運符咒S級", category: "CHARM", rarity: "EPIC", iconEmoji: "🧧", priceCoins: 5000 },
  { slug: "charm-a", name: "幸運符咒A級", category: "CHARM", rarity: "RARE", iconEmoji: "🧧", priceCoins: 2400 },
  { slug: "charm-b", name: "幸運符咒B級", category: "CHARM", rarity: "UNCOMMON", iconEmoji: "🧧", priceCoins: 1050 },
  { slug: "charm-c", name: "幸運符咒C級", category: "CHARM", iconEmoji: "🧧", priceCoins: 350 },
  // 靈氣
  { slug: "aura-holy", name: "聖之靈氣", category: "AURA", rarity: "RARE", iconEmoji: "✨", priceCoins: 270 },
  { slug: "aura-dark", name: "暗之靈氣", category: "AURA", rarity: "RARE", iconEmoji: "🌑", priceCoins: 270 },
  { slug: "aura-water", name: "水之靈氣", category: "AURA", iconEmoji: "💧", priceCoins: 30 },
  { slug: "aura-fire", name: "火之靈氣", category: "AURA", iconEmoji: "🔥", priceCoins: 30 },
  { slug: "aura-earth", name: "地之靈氣", category: "AURA", iconEmoji: "🪨", priceCoins: 10 },
  { slug: "aura-wind", name: "風之靈氣", category: "AURA", iconEmoji: "🌬️", priceCoins: 10 },
  // 寶石/原石
  { slug: "earth-stone", name: "地之原石", category: "GEM", iconEmoji: "🟫", priceCoins: 30 },
  { slug: "wind-stone", name: "風之原石", category: "GEM", iconEmoji: "🟦", priceCoins: 30 },
  { slug: "star-stone", name: "星之原石", category: "GEM", rarity: "RARE", iconEmoji: "⭐", priceCoins: null },
  { slug: "star-meteor", name: "星之隕石", category: "GEM", rarity: "EPIC", iconEmoji: "☄️", priceCoins: null },
  { slug: "emerald", name: "綠寶石", category: "GEM", rarity: "RARE", iconEmoji: "💚", priceCoins: 300 },
  { slug: "sapphire-ore-small", name: "小型藍寶石礦", category: "GEM", rarity: "RARE", iconEmoji: "🔷", priceCoins: null },
  // 礦石
  { slug: "ore-mana", name: "魔力的礦石", category: "GEM", rarity: "RARE", iconEmoji: "🪨", priceCoins: null },
  { slug: "ore-amazing", name: "驚嘆的礦石", category: "GEM", rarity: "UNCOMMON", iconEmoji: "🪨", priceCoins: null },
  { slug: "ore-fine", name: "精選的礦石", category: "GEM", iconEmoji: "🪨", priceCoins: null },
  { slug: "ore-common", name: "普通的礦石", category: "GEM", iconEmoji: "🪨", priceCoins: null },
  // 木材
  { slug: "wood-paulownia", name: "梧桐木", category: "WOOD", iconEmoji: "🪵", priceCoins: 24 },
  { slug: "wood-cedar", name: "杉木", category: "WOOD", iconEmoji: "🪵", priceCoins: 60 },
  { slug: "wood-sandal", name: "檀香木", category: "WOOD", rarity: "RARE", iconEmoji: "🪵", priceCoins: 200 },
  { slug: "wood-ginkgo", name: "銀杏木", category: "WOOD", rarity: "EPIC", iconEmoji: "🪵", priceCoins: 500 },
  // 合成材料
  { slug: "magic-craft", name: "魔法工藝", category: "MATERIAL", iconEmoji: "✨", priceCoins: 90 },
  { slug: "glue-c", name: "黏著劑C級", category: "MATERIAL", iconEmoji: "🧴", priceCoins: 30 },
  // 藥水
  { slug: "potion-energy-small", name: "小型體力藥水", category: "POTION", iconEmoji: "🧪", priceHearts: 500 },
  // 戰利品（探索/挖礦掉落）
  { slug: "demon-horn-small", name: "小惡魔的角", category: "TROPHY", iconEmoji: "👿", priceCoins: null },
  { slug: "demon-horn", name: "惡魔的角", category: "TROPHY", rarity: "RARE", iconEmoji: "😈", priceCoins: null },
  { slug: "devil-king-horn", name: "魔王的角", category: "TROPHY", rarity: "EPIC", iconEmoji: "👹", priceCoins: null },
  { slug: "mask-yellow", name: "小丑面具(黃)", category: "TROPHY", iconEmoji: "🎭", priceCoins: null },
  { slug: "mask-green", name: "小丑面具(綠)", category: "TROPHY", iconEmoji: "🎭", priceCoins: null },
  { slug: "mask-purple", name: "小丑面具(紫)", category: "TROPHY", rarity: "RARE", iconEmoji: "🎭", priceCoins: null },
  { slug: "blood-dirty", name: "骯髒血液", category: "TROPHY", iconEmoji: "🩸", priceCoins: null },
  { slug: "blood-foul", name: "污穢血液", category: "TROPHY", iconEmoji: "🩸", priceCoins: null },
  { slug: "blood", name: "血液", category: "TROPHY", iconEmoji: "🩸", priceCoins: null },
  { slug: "lizard-skin-fire", name: "火焰蜥蜴的皮", category: "TROPHY", iconEmoji: "🦎", priceCoins: null },
  { slug: "ifrit-skin", name: "伊佛利特的皮膚", category: "TROPHY", rarity: "RARE", iconEmoji: "🦎", priceCoins: null },
  { slug: "asitakio-skin", name: "阿西塔基奧的皮", category: "TROPHY", rarity: "EPIC", iconEmoji: "🦎", priceCoins: null },
  { slug: "ghost-head-red", name: "赤鬼的首級", category: "TROPHY", iconEmoji: "👺", priceCoins: null },
  { slug: "ghost-head-green", name: "綠鬼的首級", category: "TROPHY", iconEmoji: "👺", priceCoins: null },
  { slug: "ghost-head-blue", name: "藍鬼的首級", category: "TROPHY", rarity: "RARE", iconEmoji: "👺", priceCoins: null },
  { slug: "fruit-tranmel", name: "特蘭梅爾果", category: "TROPHY", iconEmoji: "🍇", priceCoins: null },
  { slug: "fruit-haimdor", name: "哈依姆朵果", category: "TROPHY", iconEmoji: "🍒", priceCoins: null },
  { slug: "fruit-white-berry", name: "白漿果", category: "TROPHY", iconEmoji: "⚪", priceCoins: null },
  { slug: "flower-yellow", name: "黃山花", category: "TROPHY", iconEmoji: "🌼", priceCoins: null },
  { slug: "flower-red", name: "紅山花", category: "TROPHY", iconEmoji: "🌺", priceCoins: null },
  { slug: "flower-purple", name: "紫山花", category: "TROPHY", iconEmoji: "🌸", priceCoins: null },
];

type RecipeSeed = {
  outputSlug: string;
  outputCount?: number;
  costCoins?: number;
  costEnergy?: number;
  description?: string;
  ingredients: Array<{ slug: string; quantity: number }>;
};

const RECIPES: RecipeSeed[] = [
  {
    outputSlug: "magic-craft",
    outputCount: 1,
    costCoins: 20,
    description: "用 4 種基礎靈氣合成魔法工藝",
    ingredients: [
      { slug: "aura-water", quantity: 1 },
      { slug: "aura-fire", quantity: 1 },
      { slug: "aura-earth", quantity: 1 },
      { slug: "aura-wind", quantity: 1 },
    ],
  },
  {
    outputSlug: "charm-b",
    outputCount: 1,
    costCoins: 100,
    description: "升級：3 張 C 級符咒 → 1 張 B 級",
    ingredients: [{ slug: "charm-c", quantity: 3 }],
  },
  {
    outputSlug: "charm-a",
    outputCount: 1,
    costCoins: 300,
    description: "升級：3 張 B 級符咒 → 1 張 A 級",
    ingredients: [{ slug: "charm-b", quantity: 3 }],
  },
  {
    outputSlug: "charm-s",
    outputCount: 1,
    costCoins: 800,
    description: "升級：3 張 A 級符咒 → 1 張 S 級",
    ingredients: [{ slug: "charm-a", quantity: 3 }],
  },
  {
    outputSlug: "ore-amazing",
    outputCount: 1,
    costCoins: 50,
    description: "用 5 個普通礦石合成驚嘆礦石",
    ingredients: [{ slug: "ore-common", quantity: 5 }],
  },
  {
    outputSlug: "ore-mana",
    outputCount: 1,
    costCoins: 150,
    description: "用 3 個驚嘆礦石合成魔力礦石",
    ingredients: [{ slug: "ore-amazing", quantity: 3 }],
  },
  {
    outputSlug: "wood-cedar",
    outputCount: 1,
    costCoins: 30,
    description: "用 3 根梧桐木合成杉木",
    ingredients: [{ slug: "wood-paulownia", quantity: 3 }],
  },
];

type DropSeed = { slug: string; weight: number; minQty?: number; maxQty?: number };

const MINE_DROPS: Record<string, DropSeed[]> = {
  // 巨龍巢穴 (10 energy) - 高級稀有
  DRAGON_LAIR: [
    { slug: "star-meteor", weight: 1 },
    { slug: "star-stone", weight: 3, maxQty: 2 },
    { slug: "ore-mana", weight: 5, maxQty: 2 },
    { slug: "ore-amazing", weight: 10, maxQty: 3 },
    { slug: "ore-fine", weight: 20, maxQty: 3 },
    { slug: "sapphire-ore-small", weight: 8 },
  ],
  ELF_CANYON: [
    { slug: "star-stone", weight: 2 },
    { slug: "ore-mana", weight: 4 },
    { slug: "ore-amazing", weight: 12, maxQty: 2 },
    { slug: "ore-fine", weight: 25, maxQty: 3 },
    { slug: "ore-common", weight: 30, maxQty: 4 },
    { slug: "sapphire-ore-small", weight: 5 },
  ],
  ABANDONED_MINE: [
    { slug: "ore-amazing", weight: 5 },
    { slug: "ore-fine", weight: 30, maxQty: 2 },
    { slug: "ore-common", weight: 60, maxQty: 4 },
  ],
};

const EXPLORE_DROPS: Record<string, DropSeed[]> = {
  FALLEN_SANCTUARY: [
    { slug: "devil-king-horn", weight: 1 },
    { slug: "demon-horn", weight: 4 },
    { slug: "demon-horn-small", weight: 10, maxQty: 2 },
    { slug: "mask-purple", weight: 3 },
    { slug: "mask-green", weight: 5 },
    { slug: "mask-yellow", weight: 8 },
    { slug: "blood-foul", weight: 12, maxQty: 2 },
    { slug: "blood-dirty", weight: 20, maxQty: 3 },
  ],
  BURNING_LAND: [
    { slug: "asitakio-skin", weight: 1 },
    { slug: "ifrit-skin", weight: 4 },
    { slug: "lizard-skin-fire", weight: 12, maxQty: 2 },
    { slug: "ghost-head-blue", weight: 5 },
    { slug: "ghost-head-green", weight: 10 },
    { slug: "ghost-head-red", weight: 15, maxQty: 2 },
    { slug: "blood", weight: 25, maxQty: 3 },
  ],
  GIANT_FOREST: [
    { slug: "fruit-tranmel", weight: 5 },
    { slug: "fruit-haimdor", weight: 10 },
    { slug: "fruit-white-berry", weight: 20, maxQty: 3 },
    { slug: "flower-yellow", weight: 25, maxQty: 3 },
    { slug: "flower-red", weight: 18, maxQty: 2 },
    { slug: "flower-purple", weight: 8 },
    { slug: "blood", weight: 15, maxQty: 2 },
  ],
};

const TREASURE_DROPS: Record<string, DropSeed[]> = {
  GOLD: [
    { slug: "charm-s", weight: 5 },
    { slug: "charm-a", weight: 15 },
    { slug: "aura-dark", weight: 10, maxQty: 2 },
    { slug: "aura-holy", weight: 10, maxQty: 2 },
    { slug: "wood-sandal", weight: 8 },
    { slug: "wood-ginkgo", weight: 5 },
    { slug: "ore-mana", weight: 12, maxQty: 2 },
    { slug: "ore-amazing", weight: 20, maxQty: 3 },
  ],
  SILVER: [
    { slug: "charm-a", weight: 5 },
    { slug: "charm-b", weight: 20 },
    { slug: "aura-water", weight: 15, maxQty: 2 },
    { slug: "aura-fire", weight: 15, maxQty: 2 },
    { slug: "wood-cedar", weight: 12 },
    { slug: "wood-sandal", weight: 5 },
    { slug: "ore-amazing", weight: 18, maxQty: 2 },
    { slug: "ore-fine", weight: 25, maxQty: 3 },
  ],
  BRONZE: [
    { slug: "charm-b", weight: 5 },
    { slug: "charm-c", weight: 25 },
    { slug: "aura-wind", weight: 20, maxQty: 2 },
    { slug: "aura-earth", weight: 20, maxQty: 2 },
    { slug: "wood-cedar", weight: 8 },
    { slug: "wood-paulownia", weight: 15 },
    { slug: "ore-fine", weight: 20, maxQty: 2 },
    { slug: "ore-common", weight: 30, maxQty: 3 },
  ],
};

const MEDAL_RECIPES = [
  {
    outputSlug: "achievement-medal-mid",
    outputCount: 1,
    costCoins: 1000,
    description: "3 枚銅勳章 → 1 枚銀勳章",
    ingredients: [{ medalSlug: "bronze-box", quantity: 3 }],
  },
  {
    outputSlug: "achievement-medal-large",
    outputCount: 1,
    costCoins: 5000,
    description: "3 枚銀勳章 → 1 枚金勳章",
    ingredients: [{ medalSlug: "silver-box", quantity: 3 }],
  },
];

async function seedItems() {
  for (const it of ITEMS) {
    await db.gameItem.upsert({
      where: { slug: it.slug },
      update: {
        name: it.name,
        description: it.description,
        category: it.category,
        rarity: it.rarity ?? "COMMON",
        iconEmoji: it.iconEmoji,
        priceCoins: it.priceCoins ?? null,
        priceHearts: it.priceHearts ?? null,
        priceGems: it.priceGems ?? null,
      },
      create: {
        slug: it.slug,
        name: it.name,
        description: it.description,
        category: it.category,
        rarity: it.rarity ?? "COMMON",
        iconEmoji: it.iconEmoji,
        priceCoins: it.priceCoins ?? null,
        priceHearts: it.priceHearts ?? null,
        priceGems: it.priceGems ?? null,
      },
    });
  }
  console.log(`✅ Seeded ${ITEMS.length} game items`);
}

async function seedRecipes() {
  for (const r of RECIPES) {
    const out = await db.gameItem.findUnique({ where: { slug: r.outputSlug } });
    if (!out) continue;
    // Find or create recipe by output (allow only 1 recipe per output for now)
    const existing = await db.itemRecipe.findFirst({ where: { outputId: out.id } });
    let recipeId: string;
    if (existing) {
      recipeId = existing.id;
      await db.itemRecipe.update({
        where: { id: existing.id },
        data: {
          outputCount: r.outputCount ?? 1,
          costCoins: r.costCoins ?? 0,
          costEnergy: r.costEnergy ?? 0,
          description: r.description,
        },
      });
      await db.recipeIngredient.deleteMany({ where: { recipeId } });
    } else {
      const created = await db.itemRecipe.create({
        data: {
          outputId: out.id,
          outputCount: r.outputCount ?? 1,
          costCoins: r.costCoins ?? 0,
          costEnergy: r.costEnergy ?? 0,
          description: r.description,
        },
      });
      recipeId = created.id;
    }
    for (const ing of r.ingredients) {
      const item = await db.gameItem.findUnique({ where: { slug: ing.slug } });
      if (!item) continue;
      await db.recipeIngredient.create({
        data: { recipeId, itemId: item.id, quantity: ing.quantity },
      });
    }
  }
  console.log(`✅ Seeded ${RECIPES.length} item recipes`);
}

async function seedDrops<T extends string>(
  table: "mineDrop" | "exploreDrop" | "treasureDrop",
  field: "location" | "treasure",
  config: Record<string, DropSeed[]>
) {
  for (const [loc, drops] of Object.entries(config)) {
    // Wipe existing for this location, re-seed
    await (db as any)[table].deleteMany({ where: { [field]: loc } });
    for (const d of drops) {
      const item = await db.gameItem.findUnique({ where: { slug: d.slug } });
      if (!item) continue;
      await (db as any)[table].create({
        data: {
          [field]: loc,
          itemId: item.id,
          weight: d.weight,
          minQty: d.minQty ?? 1,
          maxQty: d.maxQty ?? 1,
        },
      });
    }
  }
  console.log(`✅ Seeded ${table}`);
}

async function seedMedalRecipes() {
  for (const r of MEDAL_RECIPES) {
    await db.medalRecipe.upsert({
      where: { id: `seed-${r.outputSlug}` },
      update: {
        outputCount: r.outputCount,
        costCoins: r.costCoins,
        description: r.description,
        ingredients: r.ingredients,
      },
      create: {
        id: `seed-${r.outputSlug}`,
        outputSlug: r.outputSlug,
        outputCount: r.outputCount,
        costCoins: r.costCoins,
        description: r.description,
        ingredients: r.ingredients,
      },
    });
  }
  console.log(`✅ Seeded ${MEDAL_RECIPES.length} medal recipes`);
}

async function main() {
  await seedItems();
  await seedRecipes();
  await seedDrops("mineDrop", "location", MINE_DROPS);
  await seedDrops("exploreDrop", "location", EXPLORE_DROPS);
  await seedDrops("treasureDrop", "treasure", TREASURE_DROPS);
  await seedMedalRecipes();
  console.log("🎮 Game center seeded.");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
