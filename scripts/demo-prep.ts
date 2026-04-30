import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  console.log("Demo 資源準備中...\n");

  // 1. Admin 補滿
  await db.userPoints.update({
    where: { userId: "admin-001" },
    data: {
      energy: 200,
      hearts: 999999,
      coins: 9999999,
      gems: 9999,
      platinum: 9999,
      reputation: 999999,
    },
  });
  console.log("OK admin: 體力 200 / 愛心 999999 / 金幣 9999999 / 寶石 9999");

  // 2. testuser 也補
  const testUser = await db.user.findUnique({ where: { username: "user" } });
  if (testUser) {
    await db.userPoints.upsert({
      where: { userId: testUser.id },
      create: {
        userId: testUser.id,
        energy: 100,
        hearts: 50000,
        coins: 100000,
        gems: 100,
        reputation: 1000,
      },
      update: { energy: 100, hearts: 50000, coins: 100000, gems: 100 },
    });
    console.log("OK user: 體力 100 / 愛心 50000 / 金幣 100000");
  }

  // 3. newbie_a 重置 PEASANT (demo 升等用)
  const newbie = await db.user.findUnique({ where: { username: "newbie_a" } });
  if (newbie) {
    await db.user.update({
      where: { id: newbie.id },
      data: { userGroup: "PEASANT", readPermission: 10 },
    });
    console.log("OK newbie_a 重置為 PEASANT");
  }

  // 4. 全平台所有用戶愛心 ≥ 100
  const updated = await db.userPoints.updateMany({
    where: { hearts: { lt: 100 } },
    data: { hearts: 100 },
  });
  console.log(`OK ${updated.count} 個用戶補愛心至 100`);

  // 5. R-18 開關
  await db.platformSetting.upsert({
    where: { key: "r18_enabled" },
    update: { value: true },
    create: { key: "r18_enabled", value: true },
  });
  console.log("OK R-18 平台開關: 開啟");

  // 6. 找一個沒持有 vip-platinum 勳章的用戶 (demo E3 用)
  const vipMedal = await db.medal.findUnique({ where: { slug: "vip-platinum" } });
  if (vipMedal) {
    const haveIt = await db.userMedal.findMany({
      where: { medalId: vipMedal.id },
      select: { userId: true },
    });
    const haveSet = new Set(haveIt.map(x => x.userId));
    const candidates = await db.user.findMany({
      where: { email: { endsWith: "@jkforum.test" } },
      select: { id: true, username: true },
    });
    const without = candidates.filter(u => !haveSet.has(u.id)).slice(0, 3);
    console.log(`OK 推薦 demo 頒 vip-platinum: ${without.map(u => "@" + u.username).join(", ")}`);
  }

  console.log("\nDemo 準備就緒！");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
