/* eslint-disable */
import { db } from "../lib/db";
import bcrypt from "bcryptjs";

(async () => {
  console.log("== Seed Demo Roles ==\n");

  // 1. VIP 訂閱
  const vipUser = await db.user.findUnique({ where: { username: "vip_member" } });
  if (vipUser) {
    const existing = await db.vipSubscription.findFirst({
      where: { userId: vipUser.id, status: "ACTIVE" },
    });
    if (!existing) {
      await db.vipSubscription.create({
        data: {
          userId: vipUser.id,
          plan: "MONTHLY",
          status: "ACTIVE",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 86400000),
          autoRenew: true,
        },
      });
      console.log("✓ vip_member 開通 VIP MONTHLY");
    } else {
      console.log("✓ vip_member 已有 VIP");
    }
  }

  // 2. 漂亮業者帳號 business_demo
  let biz = await db.user.findUnique({ where: { username: "business_demo" } });
  if (!biz) {
    biz = await db.user.create({
      data: {
        username: "business_demo",
        email: "business_demo@jkforum.test",
        hashedPassword: await bcrypt.hash("Test123!", 10),
        displayName: "蝶舞舒壓（示範業者）",
        role: "USER",
        userType: "BUSINESS",
        merchantName: "蝶舞舒壓有限公司",
        merchantBio: "本店環境舒適、技師專業、價格透明",
        merchantVerified: true,
        emailVerified: new Date(),
        smsVerified: new Date(),
        phoneNumber: "0912345678",
        phoneCountry: "+886",
      },
    });
    await db.userPoints.upsert({
      where: { userId: biz.id },
      create: { userId: biz.id, coins: 50000 },
      update: { coins: 50000 },
    });
    console.log("✓ 建立 business_demo（已認證 + 50000 金幣）");
  } else {
    console.log("✓ business_demo 已存在");
  }

  // 業者錢包
  const wallet = await db.businessWallet.findUnique({ where: { merchantId: biz.id } });
  if (!wallet) {
    await db.businessWallet.create({
      data: { merchantId: biz.id, balance: 25000, totalDeposit: 30000, totalSpent: 5000 },
    });
    console.log("✓ business_demo 錢包：餘額 NT$25,000 / 已儲值 NT$30,000 / 已花 NT$5,000");
  }

  // 業者錢包交易紀錄
  const txCount = await db.businessWalletTx.count({ where: { merchantId: biz.id } });
  if (txCount === 0) {
    const txs: any[] = [];
    let bal = 5000;
    for (let i = 0; i < 6; i++) {
      const isDeposit = i % 2 === 0;
      const amt = isDeposit ? 10000 : -2000;
      bal += amt;
      txs.push({
        merchantId: biz.id,
        type: isDeposit ? ("DEPOSIT" as const) : ("AD_PAYMENT" as const),
        amount: amt,
        balance: bal,
        note: isDeposit ? `[DEMO] 儲值 NT$10,000（綠界）` : `[DEMO] 刊登廣告扣款 T1000`,
        createdAt: new Date(Date.now() - (12 - i) * 86400000),
      });
    }
    for (const t of txs) await db.businessWalletTx.create({ data: t });
    console.log(`✓ business_demo 交易紀錄：${txs.length} 筆`);
  }

  // 給 business_demo 建 3 個廣告（不同 tier）
  const adCount = await db.businessAd.count({ where: { merchantId: biz.id } });
  if (adCount === 0) {
    const massageForum = await db.forum.findFirst({ where: { slug: "massage" } });
    if (massageForum) {
      const tiers: Array<"T3000" | "T2000" | "T1000"> = ["T3000", "T2000", "T1000"];
      const titles = [
        "【蝶舞舒壓】台北東區 / 頂級SPA / 環境優美",
        "【蝶舞舒壓】信義區分店 / 預約制 / 服務專業",
        "【蝶舞舒壓】中山店 / 24h 營業 / 平價優質",
      ];
      for (let i = 0; i < 3; i++) {
        await db.businessAd.create({
          data: {
            merchantId: biz.id,
            forumId: massageForum.id,
            title: titles[i],
            description: "蝶舞舒壓 — 頂級SPA體驗，環境舒適、技師專業、價格透明。預約專線 02-2345-6789",
            city: "台北市",
            district: i === 0 ? "信義區" : i === 1 ? "大安區" : "中山區",
            tier: tiers[i],
            tierAmountTwd: i === 0 ? 3000 : i === 1 ? 2000 : 1000,
            status: "ACTIVE",
            priceMin: 2000,
            priceMax: 5000,
            sortWeight: 100 - i * 10,
            publishedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 86400000),
            tags: ["精油按摩", "舒壓", "預約制"],
            coverImageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400",
            imageUrls: [
              "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800",
              "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
            ],
          },
        });
      }
      console.log(`✓ business_demo 建立 3 個廣告（T3000/T2000/T1000，按摩版）`);
    }
  }

  // 給 sage_old 多放一些聲望（demo「資深會員」感覺）
  const sage = await db.user.findUnique({ where: { username: "sage_old" } });
  if (sage) {
    const sagePts = await db.userPoints.findUnique({ where: { userId: sage.id } });
    if (sagePts && sagePts.coins < 100000) {
      await db.userPoints.update({ where: { userId: sage.id }, data: { coins: 200000 } });
      console.log("✓ sage_old 金幣補到 200,000（資深感）");
    }
  }

  // 確保 newbie_a 是新手（demo-prep 已做但再保險）
  const newbie = await db.user.findUnique({ where: { username: "newbie_a" } });
  if (newbie) {
    await db.userPoints.upsert({
      where: { userId: newbie.id },
      create: { userId: newbie.id, coins: 50, energy: 100 },
      update: { coins: 50 },
    });
    console.log("✓ newbie_a 重置金幣 50（新手感）");
  }

  console.log("\n=== 完成 ===");
  console.log("\n📌 業者 demo 帳號：");
  console.log("  Email: business_demo@jkforum.test");
  console.log("  密碼: Test123!");
  console.log("  狀態: 已認證 + 已 KYC + 錢包 NT$25,000 + 3 個廣告");

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
