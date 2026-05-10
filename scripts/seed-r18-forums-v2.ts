/* eslint-disable no-console */
/**
 * Seed: 3 個新 R18 版區（個工 / 好茶 / 魚訊）+ 5 個 R18 版區的 advancedFilters 預設值
 *
 * 跑法：
 *   npx tsx scripts/seed-r18-forums-v2.ts
 *
 * 前置：先跑 npx tsx scripts/migrate-forum-advanced-filters.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ── 進階搜尋預設 schema（per-forum；admin 之後可改）──────────────────────────
type FilterDef =
  | { key: string; label: string; type: "select"; options: string[] }
  | { key: string; label: string; type: "multiselect"; options: string[] }
  | { key: string; label: string; type: "range"; min: number; max: number; step?: number; unit?: string };

// R18 通用：價位/年齡/外型/服務類別/可預約/付款
const R18_BASE: FilterDef[] = [
  { key: "priceRange", label: "價位帶", type: "range", min: 1000, max: 10000, step: 500, unit: "元" },
  { key: "age", label: "年齡帶", type: "select", options: ["18-22", "23-27", "28-32", "33-38", "38+"] },
  { key: "height", label: "身高", type: "select", options: ["155 以下", "156-160", "161-165", "166-170", "171+"] },
  { key: "bodyType", label: "外型", type: "multiselect", options: ["纖細", "標準", "豐滿", "肉感", "巨乳", "美腿", "童顏", "氣質"] },
  { key: "service", label: "服務類別", type: "multiselect", options: ["全套", "半套", "口", "莞莞", "毒龍", "潮吹", "顏射", "口爆", "無套吹", "舔莖", "舔肛"] },
  { key: "appointment", label: "可預約", type: "select", options: ["可", "不可", "限熟客"] },
  { key: "payment", label: "付款", type: "multiselect", options: ["現金", "轉帳", "LINE Pay", "悠遊付", "信用卡"] },
  { key: "language", label: "語言", type: "multiselect", options: ["國語", "台語", "粵語", "英文", "日文", "簡體中文"] },
  { key: "openHours", label: "營業時段", type: "multiselect", options: ["白天", "晚上", "深夜", "24h"] },
];

// 個工專屬補充：工作室類型
const SOLO_EXTRA: FilterDef[] = [
  { key: "studioType", label: "個工型態", type: "multiselect", options: ["私人工作室", "外約", "套房", "汽旅", "戶外"] },
];

// 好茶專屬：產地/茶種風格（包裝詞，業者描述用）
const TEA_EXTRA: FilterDef[] = [
  { key: "teaOrigin", label: "產地", type: "multiselect", options: ["北部", "中部", "南部", "東部", "離島"] },
  { key: "teaStyle", label: "風格", type: "multiselect", options: ["清香", "醇厚", "蜜香", "甘甜", "回韻"] },
];

// 魚訊專屬：訊息來源 / 認證程度
const FISH_EXTRA: FilterDef[] = [
  { key: "infoSource", label: "資訊來源", type: "select", options: ["業者自送", "用戶投稿", "編輯精選"] },
  { key: "verified", label: "認證程度", type: "select", options: ["已認證", "已實測", "未實測"] },
];

// 按摩專屬：手法
const MASSAGE_EXTRA: FilterDef[] = [
  { key: "technique", label: "手法", type: "multiselect", options: ["指油壓", "腳底", "全身", "經絡", "刮痧", "拔罐", "撥筋"] },
];

// 酒店專屬：制服風格
const BAR_EXTRA: FilterDef[] = [
  { key: "uniform", label: "制服風格", type: "multiselect", options: ["OL", "學生", "護士", "空姐", "女僕", "禮服", "便服"] },
];

// ── 5 個 R18 版區設定 ────────────────────────────────────────────────────────
type ForumSpec = {
  slug: string;
  name: string;
  description: string;
  defaultTier: string;
  themes: string[];
  filters: FilterDef[];
};

const R18_FORUMS: ForumSpec[] = [
  {
    slug: "massage",
    name: "按摩/指油壓/理容",
    description: "服務業評測（R-18）",
    defaultTier: "T500",
    themes: ["指油壓", "腳底", "全身", "理容"],
    filters: [...R18_BASE, ...MASSAGE_EXTRA],
  },
  {
    slug: "bar-uniform",
    name: "酒店/制服/禮服",
    description: "酒店、夜生活（R-18）",
    defaultTier: "T1000",
    themes: ["制服", "禮服", "便服"],
    filters: [...R18_BASE, ...BAR_EXTRA],
  },
  {
    slug: "solo-studio",
    name: "個工",
    description: "個人工作室評測（R-18）",
    defaultTier: "T1000",
    themes: ["私人工作室", "外約", "套房"],
    filters: [...R18_BASE, ...SOLO_EXTRA],
  },
  {
    slug: "good-tea",
    name: "好茶",
    description: "好茶分享與評測（R-18）",
    defaultTier: "T1000",
    themes: ["清香", "醇厚", "蜜香"],
    filters: [...R18_BASE, ...TEA_EXTRA],
  },
  {
    slug: "fish-info",
    name: "魚訊",
    description: "魚訊交流區（R-18）",
    defaultTier: "T500",
    themes: ["業者自送", "用戶投稿", "編輯精選"],
    filters: [...R18_BASE, ...FISH_EXTRA],
  },
];

async function main() {
  // 1. 取得 variety 分類
  const variety = await db.category.findUnique({ where: { slug: "variety" } });
  if (!variety) {
    throw new Error("找不到 variety 分類，請先跑 prisma/seed-categories-v2.ts");
  }
  console.log(`📂 分類：${variety.name} (${variety.slug})\n`);

  // 2. 找最大 sortOrder（新版區排在後面）
  const maxOrder = await db.forum.findFirst({
    where: { categoryId: variety.id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  let nextOrder = (maxOrder?.sortOrder ?? 0) + 1;

  // 3. Upsert 5 個版區
  for (const spec of R18_FORUMS) {
    const existing = await db.forum.findUnique({ where: { slug: spec.slug } });
    if (existing) {
      await db.forum.update({
        where: { slug: spec.slug },
        data: {
          allowPaidListing: true,
          defaultAdTier: spec.defaultTier,
          themeCategoriesJson: spec.themes,
          advancedFiltersJson: spec.filters as unknown as object,
          rating: "R18",
          ageGateEnabled: true,
        },
      });
      console.log(`🔄 更新 ${spec.name} (${spec.slug}) — filters: ${spec.filters.length}`);
    } else {
      await db.forum.create({
        data: {
          categoryId: variety.id,
          slug: spec.slug,
          name: spec.name,
          description: spec.description,
          rating: "R18",
          ageGateEnabled: true,
          allowPaidListing: true,
          defaultAdTier: spec.defaultTier,
          themeCategoriesJson: spec.themes,
          forceThemeCategory: false,
          advancedFiltersJson: spec.filters as unknown as object,
          sortOrder: nextOrder++,
          isVisible: true,
        },
      });
      console.log(`✨ 新增 ${spec.name} (${spec.slug}) — filters: ${spec.filters.length}`);
    }
  }

  console.log(`\n🎉 完成。共處理 ${R18_FORUMS.length} 個 R18 版區。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
