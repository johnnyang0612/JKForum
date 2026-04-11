import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("開始建立種子資料...");

  // ============================================================
  // 1. 建立超級管理員
  // ============================================================
  const hashedPassword = await bcrypt.hash("Admin123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@jkforum.com" },
    update: {},
    create: {
      email: "admin@jkforum.com",
      hashedPassword,
      username: "admin",
      displayName: "系統管理員",
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
      profile: {
        create: {
          bio: "JKForum 系統管理員",
          isPublic: true,
        },
      },
      points: {
        create: {
          reputation: 999999,
          coins: 999999,
          platinum: 999999,
          totalPoints: 999999,
          level: 0, // 皇帝
        },
      },
    },
  });

  console.log(`管理員帳號建立完成: ${admin.email}`);

  // ============================================================
  // 2. 建立分類與看板
  // ============================================================

  // 分類 1：綜合討論
  const cat1 = await prisma.category.upsert({
    where: { slug: "general" },
    update: {},
    create: {
      name: "綜合討論",
      slug: "general",
      description: "各種話題的綜合討論區",
      sortOrder: 1,
      isVisible: true,
    },
  });

  // 分類 2：影視娛樂
  const cat2 = await prisma.category.upsert({
    where: { slug: "entertainment" },
    update: {},
    create: {
      name: "影視娛樂",
      slug: "entertainment",
      description: "電影、電視劇、動漫等娛樂話題",
      sortOrder: 2,
      isVisible: true,
    },
  });

  // 分類 3：科技3C
  const cat3 = await prisma.category.upsert({
    where: { slug: "tech" },
    update: {},
    create: {
      name: "科技3C",
      slug: "tech",
      description: "手機、電腦、遊戲等科技話題",
      sortOrder: 3,
      isVisible: true,
    },
  });

  // 分類 4：創作園地
  const cat4 = await prisma.category.upsert({
    where: { slug: "creative" },
    update: {},
    create: {
      name: "創作園地",
      slug: "creative",
      description: "圖文創作、小說、攝影等創作分享",
      sortOrder: 4,
      isVisible: true,
    },
  });

  // 分類 5：生活休閒
  const cat5 = await prisma.category.upsert({
    where: { slug: "lifestyle" },
    update: {},
    create: {
      name: "生活休閒",
      slug: "lifestyle",
      description: "美食、旅遊、運動等生活話題",
      sortOrder: 5,
      isVisible: true,
    },
  });

  console.log("分類建立完成");

  // ============================================================
  // 綜合討論看板
  // ============================================================
  await prisma.forum.upsert({
    where: { slug: "current-events" },
    update: {},
    create: {
      categoryId: cat1.id,
      name: "時事新聞",
      slug: "current-events",
      description: "國內外時事新聞討論",
      sortOrder: 1,
      rules: "# 版規\n1. 禁止散布不實資訊\n2. 請附上新聞來源連結\n3. 討論請保持理性",
    },
  });

  await prisma.forum.upsert({
    where: { slug: "daily-life" },
    update: {},
    create: {
      categoryId: cat1.id,
      name: "生活話題",
      slug: "daily-life",
      description: "日常生活的各種話題分享",
      sortOrder: 2,
    },
  });

  await prisma.forum.upsert({
    where: { slug: "newbie" },
    update: {},
    create: {
      categoryId: cat1.id,
      name: "新手區",
      slug: "newbie",
      description: "歡迎新會員！在這裡自我介紹或提問",
      sortOrder: 3,
      rules: "# 版規\n1. 歡迎新手提問\n2. 請善用搜尋功能\n3. 老手們請友善回覆",
    },
  });

  // ============================================================
  // 影視娛樂看板
  // ============================================================
  await prisma.forum.upsert({
    where: { slug: "movies" },
    update: {},
    create: {
      categoryId: cat2.id,
      name: "電影",
      slug: "movies",
      description: "電影討論、影評、推薦",
      sortOrder: 1,
      rules: "# 版規\n1. 討論劇情請標註「劇透」\n2. 禁止分享盜版資源",
    },
  });

  await prisma.forum.upsert({
    where: { slug: "tv-shows" },
    update: {},
    create: {
      categoryId: cat2.id,
      name: "電視劇",
      slug: "tv-shows",
      description: "台劇、韓劇、美劇、日劇等電視劇討論",
      sortOrder: 2,
    },
  });

  await prisma.forum.upsert({
    where: { slug: "anime" },
    update: {},
    create: {
      categoryId: cat2.id,
      name: "動漫",
      slug: "anime",
      description: "動畫、漫畫、輕小說討論",
      sortOrder: 3,
    },
  });

  // ============================================================
  // 科技3C看板
  // ============================================================
  await prisma.forum.upsert({
    where: { slug: "smartphones" },
    update: {},
    create: {
      categoryId: cat3.id,
      name: "手機",
      slug: "smartphones",
      description: "手機開箱、評測、使用心得",
      sortOrder: 1,
    },
  });

  await prisma.forum.upsert({
    where: { slug: "computers" },
    update: {},
    create: {
      categoryId: cat3.id,
      name: "電腦",
      slug: "computers",
      description: "桌機、筆電、零組件討論",
      sortOrder: 2,
    },
  });

  await prisma.forum.upsert({
    where: { slug: "gaming" },
    update: {},
    create: {
      categoryId: cat3.id,
      name: "遊戲",
      slug: "gaming",
      description: "各平台遊戲討論、攻略、心得",
      sortOrder: 3,
    },
  });

  // ============================================================
  // 創作園地看板
  // ============================================================
  await prisma.forum.upsert({
    where: { slug: "art-creation" },
    update: {},
    create: {
      categoryId: cat4.id,
      name: "圖文創作",
      slug: "art-creation",
      description: "繪畫、設計、攝影等圖文創作分享",
      sortOrder: 1,
      rules: "# 版規\n1. 原創作品請標註「原創」\n2. 轉載請註明出處\n3. 禁止盜用他人作品",
    },
  });

  await prisma.forum.upsert({
    where: { slug: "fiction" },
    update: {},
    create: {
      categoryId: cat4.id,
      name: "小說",
      slug: "fiction",
      description: "原創小說、同人文、連載",
      sortOrder: 2,
    },
  });

  // ============================================================
  // 生活休閒看板
  // ============================================================
  await prisma.forum.upsert({
    where: { slug: "food" },
    update: {},
    create: {
      categoryId: cat5.id,
      name: "美食",
      slug: "food",
      description: "美食推薦、食譜分享、餐廳評論",
      sortOrder: 1,
    },
  });

  await prisma.forum.upsert({
    where: { slug: "travel" },
    update: {},
    create: {
      categoryId: cat5.id,
      name: "旅遊",
      slug: "travel",
      description: "旅遊分享、行程規劃、景點推薦",
      sortOrder: 2,
    },
  });

  await prisma.forum.upsert({
    where: { slug: "sports" },
    update: {},
    create: {
      categoryId: cat5.id,
      name: "運動體育",
      slug: "sports",
      description: "各種運動話題、賽事討論",
      sortOrder: 3,
    },
  });

  console.log("看板建立完成");

  // ============================================================
  // 3. 建立預設標籤
  // ============================================================
  const tags = [
    { name: "熱門", slug: "hot", color: "#FF3B30" },
    { name: "精華", slug: "featured", color: "#FFD700" },
    { name: "新手", slug: "newbie", color: "#34C759" },
    { name: "教學", slug: "tutorial", color: "#007AFF" },
    { name: "問答", slug: "qa", color: "#FF9500" },
    { name: "分享", slug: "sharing", color: "#AF52DE" },
    { name: "討論", slug: "discussion", color: "#5856D6" },
    { name: "公告", slug: "announcement", color: "#FF2D55" },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }

  console.log("標籤建立完成");

  console.log("種子資料建立完成！");
  console.log("---");
  console.log("管理員帳號: admin@jkforum.com");
  console.log("管理員密碼: Admin123!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("種子資料建立失敗:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
