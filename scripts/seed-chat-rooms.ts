import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const ROOMS = [
  { slug: "lobby", name: "大廳", description: "歡迎來到 JKForum，這裡是公開大廳", rating: "G" as const, sortOrder: 0 },
  { slug: "chat", name: "閒聊", description: "輕鬆聊天、分享日常", rating: "G" as const, sortOrder: 1 },
  { slug: "gaming", name: "遊戲", description: "聊遊戲、揪團、攻略討論", rating: "G" as const, sortOrder: 2 },
  { slug: "news", name: "新聞時事", description: "即時新聞、時事討論", rating: "PG13" as const, sortOrder: 3 },
  { slug: "tech", name: "3C 科技", description: "手機、電腦、軟體開發", rating: "G" as const, sortOrder: 4 },
  { slug: "adult", name: "成人區", description: "18+ 限定（受平台 R-18 開關控制）", rating: "R18" as const, sortOrder: 99 },
];

async function main() {
  for (const r of ROOMS) {
    await db.chatRoom.upsert({
      where: { slug: r.slug },
      update: { name: r.name, description: r.description, rating: r.rating, sortOrder: r.sortOrder },
      create: r,
    });
  }
  console.log(`✅ Seeded ${ROOMS.length} chat rooms`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
