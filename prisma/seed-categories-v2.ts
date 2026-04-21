/**
 * Expand categories to 13 big categories with rating.
 * Preserves existing data, adds new categories + forums.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CategoryDef = {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  rating: "G" | "PG13" | "R18";
  sortOrder: number;
  forums: Array<{
    slug: string;
    name: string;
    description: string;
    rating?: "G" | "PG13" | "R18";
  }>;
};

const CATEGORIES: CategoryDef[] = [
  {
    slug: "jkf-magazine",
    name: "JKF 雜誌",
    description: "高品質編輯內容 — 女神焦點、男人玩物、兩性生活",
    emoji: "📘",
    rating: "PG13",
    sortOrder: 1,
    forums: [
      { slug: "goddess-focus", name: "女神焦點", description: "精選女神、明星專訪", rating: "PG13" },
      { slug: "mens-toys", name: "男人玩物", description: "男性生活品味", rating: "PG13" },
      { slug: "gender-relations", name: "兩性生活", description: "兩性話題、感情心理", rating: "PG13" },
    ],
  },
  {
    slug: "hot-forums",
    name: "熱門版區",
    description: "網路美女、女神寫真、模特兒",
    emoji: "🔥",
    rating: "PG13",
    sortOrder: 2,
    forums: [
      { slug: "net-beauty", name: "網路美女", description: "IG、抖音、網紅美女", rating: "PG13" },
      { slug: "photogenic", name: "女神寫真", description: "寫真集、攝影作品", rating: "PG13" },
      { slug: "models", name: "模特兒", description: "模特兒動態、作品分享", rating: "PG13" },
    ],
  },
  {
    slug: "beauty-wall",
    name: "美女牆",
    description: "IG 推特、亞洲精選、全球精選、ShowGirl、Coser、抖音",
    emoji: "📷",
    rating: "PG13",
    sortOrder: 3,
    forums: [
      { slug: "ig-twitter", name: "IG 推特美女", description: "社群平台美女", rating: "PG13" },
      { slug: "asia-picks", name: "亞洲精選美女", description: "亞洲精選", rating: "PG13" },
      { slug: "global-picks", name: "全球精選美女", description: "全球各地", rating: "PG13" },
      { slug: "showgirl", name: "亞洲 ShowGirl", description: "展場 Show Girl", rating: "PG13" },
      { slug: "coser", name: "亞洲 Coser", description: "角色扮演", rating: "PG13" },
      { slug: "douyin-kuaishou", name: "抖音快手視頻", description: "短視頻分享", rating: "PG13" },
    ],
  },
  {
    slug: "community",
    name: "社團",
    description: "粉絲俱樂部、後援會",
    emoji: "👥",
    rating: "G",
    sortOrder: 4,
    forums: [
      { slug: "fan-club", name: "粉絲俱樂部", description: "各類偶像粉絲聚落" },
      { slug: "backup-group", name: "後援會", description: "後援、活動應援" },
    ],
  },
  {
    slug: "new-world",
    name: "新世界",
    description: "世界不可思議、奇聞、冷知識",
    emoji: "🌍",
    rating: "G",
    sortOrder: 6,
    forums: [
      { slug: "mysteries", name: "世界不可思議", description: "奇聞異事" },
      { slug: "trivia", name: "冷知識", description: "生活冷知識" },
    ],
  },
  {
    slug: "variety",
    name: "五花八門",
    description: "按摩/指油壓、酒店/制服",
    emoji: "🎭",
    rating: "R18",
    sortOrder: 7,
    forums: [
      { slug: "massage", name: "按摩/指油壓/理容", description: "服務業評測（R-18）", rating: "R18" },
      { slug: "bar-uniform", name: "酒店/制服/禮服", description: "酒店、夜生活（R-18）", rating: "R18" },
    ],
  },
  {
    slug: "creations",
    name: "創作專區",
    description: "文章創作、插畫、攝影",
    emoji: "🎨",
    rating: "G",
    sortOrder: 8,
    forums: [
      { slug: "writing", name: "文章創作", description: "小說、散文、評論" },
      { slug: "illustration", name: "插畫藝術", description: "原創插畫、繪畫分享" },
      { slug: "photography", name: "攝影作品", description: "攝影作品集" },
    ],
  },
  {
    slug: "gaming",
    name: "遊戲",
    description: "手遊、主機、PC、電競",
    emoji: "🎮",
    rating: "G",
    sortOrder: 10,
    forums: [
      { slug: "mobile-games", name: "手機遊戲", description: "手遊評測、攻略" },
      { slug: "console-games", name: "主機遊戲", description: "PS/Xbox/Switch" },
      { slug: "pc-games", name: "PC 遊戲", description: "Steam / Epic / 獨立遊戲" },
      { slug: "esports", name: "電子競技", description: "電競賽事、戰術分享" },
    ],
  },
  {
    slug: "adult-entertainment",
    name: "成人娛樂",
    description: "日本新作、女優、寫真、影片（R-18）",
    emoji: "🔞",
    rating: "R18",
    sortOrder: 11,
    forums: [
      { slug: "av-news", name: "日本 - 新作情報", description: "AV 新片情報", rating: "R18" },
      { slug: "quest-search", name: "懸賞 - 求檔案", description: "懸賞搜尋", rating: "R18" },
      { slug: "quest-actress", name: "懸賞 - 搜女優", description: "女優搜尋", rating: "R18" },
      { slug: "adult-discussion", name: "色區 - 討論區", description: "成人話題", rating: "R18" },
      { slug: "adult-pics-cool", name: "貼圖 - 清涼寫真", description: "", rating: "R18" },
      { slug: "adult-pics-sexy", name: "貼圖 - 性感激情", description: "", rating: "R18" },
      { slug: "adult-stream-asia", name: "線上看 - 亞洲影片", description: "", rating: "R18" },
    ],
  },
  {
    slug: "adult-downloads",
    name: "成人下載",
    description: "BT、免空（影片/動畫/遊戲）",
    emoji: "⬇️",
    rating: "R18",
    sortOrder: 12,
    forums: [
      { slug: "dl-bt-video", name: "BT 下載 - 成人影片", description: "", rating: "R18" },
      { slug: "dl-free-video", name: "免空下載 - 成人影片", description: "", rating: "R18" },
      { slug: "dl-anime", name: "BT 下載 - 成人動畫", description: "", rating: "R18" },
      { slug: "dl-games", name: "BT 下載 - 成人遊戲", description: "", rating: "R18" },
    ],
  },
  {
    slug: "station",
    name: "站務",
    description: "公告、活動、FAQ、新手教學、報到、勳章申請",
    emoji: "🏢",
    rating: "G",
    sortOrder: 13,
    forums: [
      { slug: "announcements", name: "論壇公告", description: "官方公告" },
      { slug: "events", name: "活動專區", description: "官方活動" },
      { slug: "newbie-guide", name: "新手教學", description: "新手上路" },
      { slug: "sign-in", name: "報到專區", description: "新會員報到" },
      { slug: "medal-apply", name: "勳章申請", description: "勳章申請版" },
    ],
  },
];

async function main() {
  console.log("開始擴充 13 大分類 ...");
  let catsCreated = 0;
  let forumsCreated = 0;

  for (const def of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: def.slug },
      create: {
        slug: def.slug,
        name: def.name,
        description: def.description,
        iconEmoji: def.emoji,
        rating: def.rating,
        isEnabled: def.rating !== "R18", // R-18 預設關
        sortOrder: def.sortOrder,
        isVisible: true,
      },
      update: {
        name: def.name,
        description: def.description,
        iconEmoji: def.emoji,
        rating: def.rating,
        sortOrder: def.sortOrder,
      },
    });
    catsCreated++;
    console.log(`  ✓ ${def.emoji} ${def.name} (${def.slug})`);

    for (let i = 0; i < def.forums.length; i++) {
      const f = def.forums[i];
      const rating = f.rating || def.rating;
      await prisma.forum.upsert({
        where: { slug: f.slug },
        create: {
          categoryId: cat.id,
          slug: f.slug,
          name: f.name,
          description: f.description,
          rating,
          ageGateEnabled: rating === "R18",
          sortOrder: i,
          isVisible: true,
        },
        update: {
          rating,
          ageGateEnabled: rating === "R18",
        },
      });
      forumsCreated++;
    }
  }

  console.log(`\n✅ 完成：${catsCreated} 大類 / ${forumsCreated} 版`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
