import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const RESOURCES = [
  // 桌布
  { title: "極簡黑色桌布合輯 4K", category: "WALLPAPER" as const, fileType: "zip", fileSize: 25 * 1024 * 1024, costCredits: 1, costCoins: 100, thumb: "wallpaper-dark", featured: true },
  { title: "Apple 風格漸層桌布 30 張", category: "WALLPAPER" as const, fileType: "zip", fileSize: 80 * 1024 * 1024, costCredits: 2, costCoins: 200, thumb: "wallpaper-apple" },
  { title: "Cyberpunk 高解析桌布包", category: "WALLPAPER" as const, fileType: "zip", fileSize: 120 * 1024 * 1024, costCredits: 3, costCoins: 300, thumb: "wallpaper-cyber" },
  // 字體
  { title: "繁中思源黑體完整版", category: "FONT" as const, fileType: "ttf", fileSize: 12 * 1024 * 1024, costCredits: 0, costCoins: 0, thumb: "font-noto", featured: true },
  { title: "免商用復古宋體", category: "FONT" as const, fileType: "otf", fileSize: 5 * 1024 * 1024, costCredits: 1, costCoins: 50, thumb: "font-song" },
  // 電子書
  { title: "Next.js 15 開發實戰電子書", category: "EBOOK" as const, fileType: "pdf", fileSize: 18 * 1024 * 1024, costCredits: 5, costCoins: 500, thumb: "ebook-next", featured: true },
  { title: "Prisma + PostgreSQL 完整教學", category: "EBOOK" as const, fileType: "pdf", fileSize: 22 * 1024 * 1024, costCredits: 5, costCoins: 500, thumb: "ebook-prisma" },
  { title: "AI 圖像生成入門到精通", category: "EBOOK" as const, fileType: "pdf", fileSize: 35 * 1024 * 1024, costCredits: 8, costCoins: 800, thumb: "ebook-ai", requiresVip: true },
  // 工具
  { title: "Mac 必裝 50 款免費 App 清單", category: "TOOL" as const, fileType: "pdf", fileSize: 2 * 1024 * 1024, costCredits: 0, costCoins: 0, thumb: "tool-mac" },
  { title: "VS Code 主題包 2026 精選", category: "TOOL" as const, fileType: "zip", fileSize: 8 * 1024 * 1024, costCredits: 1, costCoins: 100, thumb: "tool-vscode" },
  // 音樂
  { title: "Lo-Fi 工作專注音樂 30 首", category: "AUDIO" as const, fileType: "zip", fileSize: 280 * 1024 * 1024, costCredits: 3, costCoins: 300, thumb: "audio-lofi", featured: true },
  { title: "電影級配樂 BGM 包", category: "AUDIO" as const, fileType: "zip", fileSize: 450 * 1024 * 1024, costCredits: 5, costCoins: 500, thumb: "audio-bgm" },
  // 影片
  { title: "去背素材 HD 影片合集", category: "VIDEO" as const, fileType: "zip", fileSize: 1200 * 1024 * 1024, costCredits: 10, costCoins: 1000, thumb: "video-stock" },
  // 圖包
  { title: "扁平化 Icon 1000 枚", category: "IMAGE_PACK" as const, fileType: "zip", fileSize: 60 * 1024 * 1024, costCredits: 2, costCoins: 200, thumb: "icon-flat" },
  { title: "免費商用插圖庫 200 張", category: "IMAGE_PACK" as const, fileType: "zip", fileSize: 150 * 1024 * 1024, costCredits: 3, costCoins: 300, thumb: "illust-free" },
  // 範本
  { title: "Notion 個人管理範本包", category: "TEMPLATE" as const, fileType: "zip", fileSize: 1 * 1024 * 1024, costCredits: 1, costCoins: 100, thumb: "tmpl-notion" },
  { title: "PowerPoint 簡報模板 50 套", category: "TEMPLATE" as const, fileType: "zip", fileSize: 200 * 1024 * 1024, costCredits: 5, costCoins: 500, thumb: "tmpl-ppt" },
];

async function main() {
  // 找個 admin 當 uploader
  const admin = await db.user.findFirst({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
  });
  if (!admin) {
    console.error("找不到 admin 用戶，跳過 seed");
    return;
  }

  let created = 0;
  for (const r of RESOURCES) {
    const existing = await db.downloadResource.findFirst({
      where: { title: r.title },
    });
    if (existing) continue;

    await db.downloadResource.create({
      data: {
        title: r.title,
        description: `${r.title} — 高品質精選資源，下載後請依授權使用。`,
        category: r.category,
        fileUrl: `https://example.com/downloads/${r.thumb}.${r.fileType}`, // dummy
        fileSize: r.fileSize,
        fileType: r.fileType,
        thumbnailUrl: `https://picsum.photos/seed/${r.thumb}/400/240`,
        costCredits: r.costCredits,
        costCoins: r.costCoins,
        requiresVip: (r as any).requiresVip ?? false,
        isFeatured: (r as any).featured ?? false,
        uploaderId: admin.id,
      },
    });
    created++;
  }
  console.log(`OK 建立 ${created} 筆下載資源（共 ${RESOURCES.length} 筆，已存在則略過）`);

  // 給 admin 100 個額度方便 demo
  await db.downloadCredit.upsert({
    where: { userId: admin.id },
    create: { userId: admin.id, balance: 100, totalEarned: 100 },
    update: { balance: 100 },
  });
  console.log(`OK admin 下載額度補滿 100`);
}

main().then(() => db.$disconnect());
