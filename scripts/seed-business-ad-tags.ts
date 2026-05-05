/* eslint-disable no-console */
/**
 * Seed: BusinessAdTag 字典
 *
 * 第一個一定是「不限」(isUnlimited=true, sortOrder=-1)。
 * 其餘依使用者提供的詞彙原樣 seed（套餐 B：保留原文，不做字面轉換）。
 *
 * 跑法：
 *   npm run seed:business-tags
 *   或
 *   npx tsx scripts/seed-business-ad-tags.ts
 *
 * 冪等：以 slug 作為唯一鍵 upsert。
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type TagSeed = {
  name: string;
  category: string | null;
  isUnlimited?: boolean;
};

// 不限 — 永遠第一個
const UNLIMITED: TagSeed = { name: "不限", category: null, isUnlimited: true };

// 主清單（依使用者提供原樣）
const TAGS_BY_CATEGORY: Record<string, string[]> = {
  組合: ["1對1", "1王2后", "2王1后", "2王2后"],
  服務: [
    "奶砲", "毒龍", "裸舌毒龍", "玉米糖毒龍",
    "按摩", "桑拿", "69", "陪洗", "共浴",
    "卸甲", "素股", "油推", "攝護腺保養", "龍筋按摩",
    "殘廢澡", "帝王浴", "泡泡浴", "泰國浴",
  ],
  口部: [
    "LG(舌吻)依氣氛衛生而定", "可親嘴",
    "無套吹", "戴套吹", "口爆", "吞精",
    "足交", "潮吹(依貴賓技術而定)",
    "品鮑", "舔蛋",
  ],
  特殊: [
    "輕功", "過水", "漫遊",
    "奶推", "屁推",
    "冰火", "冰塊(客自備)",
    "顏射", "倒立吹簫", "水床浴", "海底撈月",
    "浴中蕭", "嘴刮痧", "嘴拔罐", "深喉嚨",
    "艷舞秀",
    "跳跳糖吹簫", "跳跳糖(客自備)",
    "果凍漫遊", "果凍吹簫", "果凍(客自備)",
  ],
  情趣: [
    "變裝", "變裝(自備免付)",
    "絲襪", "絲襪(自備免付)",
    "玩具(按摩棒)", "玩具(跳蛋)",
    "情趣用品(客自備)",
  ],
  無套: ["無套做", "無套內射", "後門"],
  其他: [
    "自慰秀", "攝影",
    "白人", "中文溝通", "英文溝通",
    "快餐", "2S", "NS", "包夜",
    "0.3", "0.5",
  ],
};

// 由 name 產生穩定 slug：
// - 移除括號內容會破壞唯一性，所以保留原文
// - 拉丁字 / 數字 / 連字號保留，其餘用 base64 hash fallback
function toSlug(name: string): string {
  // 嘗試保留 ASCII；中文則 base36 hash 化
  const ascii = name
    .toLowerCase()
    .replace(/[\s　]+/g, "-")
    .replace(/[^\w\-.()]/g, "");
  if (ascii && /^[a-z0-9\-.()]+$/i.test(ascii)) {
    return `bat-${ascii}`.slice(0, 60);
  }
  // 含中文 → 直接用原字串 hash
  let h = 5381;
  for (let i = 0; i < name.length; i++) h = ((h << 5) + h) ^ name.charCodeAt(i);
  return `bat-${(h >>> 0).toString(36)}-${name.length}`;
}

async function upsertTag(
  seed: TagSeed,
  sortOrder: number,
): Promise<void> {
  const slug = toSlug(seed.name);
  await db.businessAdTag.upsert({
    where: { slug },
    create: {
      name: seed.name,
      slug,
      category: seed.category,
      sortOrder,
      isActive: true,
      isUnlimited: !!seed.isUnlimited,
    },
    update: {
      // 名稱 / 類別 / 排序 / 不限旗標 都用 seed 覆寫；
      // 但保留 isActive — 管理員若手動 disable 不要被 seed 蓋回
      name: seed.name,
      category: seed.category,
      sortOrder,
      isUnlimited: !!seed.isUnlimited,
    },
  });
}

async function main() {
  let total = 0;

  // 1. 不限（第一個）
  await upsertTag(UNLIMITED, -1);
  total++;

  // 2. 其餘標籤 — 每個 category 從 0 開始遞增 10
  let categoryBase = 0;
  for (const [category, names] of Object.entries(TAGS_BY_CATEGORY)) {
    let i = 0;
    for (const name of names) {
      await upsertTag({ name, category }, categoryBase + i);
      total++;
      i++;
    }
    categoryBase += 1000; // 大跳階保留新增空間
  }

  console.log(`✅ 已 upsert ${total} 個 BusinessAdTag`);
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
