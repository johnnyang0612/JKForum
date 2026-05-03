/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const FORUM_KEYS = ["massage", "bar-uniform"];

const TIERS = ["T3000", "T2000", "T1000", "T1000", "T500", "T500", "T500", "FREE", "FREE", "FREE"] as const;
const TIER_PRICE: Record<string, number> = { T3000: 3000, T2000: 2000, T1000: 1000, T500: 500, FREE: 0 };
const TIER_RANK: Record<string, number> = { T3000: 50000, T2000: 20000, T1000: 10000, T500: 5000, FREE: 100 };

const CITY_DISTRICTS: Array<[string, string]> = [
  ["台北市", "信義區"], ["台北市", "中山區"], ["台北市", "大安區"],
  ["新北市", "板橋區"], ["新北市", "中和區"], ["新北市", "新店區"],
  ["桃園市", "中壢區"], ["台中市", "西屯區"], ["台中市", "北屯區"],
  ["高雄市", "前鎮區"], ["高雄市", "三民區"], ["台南市", "東區"],
];

const TITLES = [
  "信義區頂級養生館 全新裝潢",
  "中山區日式紓壓會館 24h 營業",
  "大安區高端 SPA 預約制",
  "板橋藍鯨會館 美女如雲",
  "中和優質指油壓 平日特惠",
  "新店溫泉養生池 假日不加價",
  "桃園精緻包廂 好停車",
  "西屯時尚 Lounge Bar 開幕特惠",
  "北屯禮服店 高顏值經紀",
  "前鎮港都酒店 制服新妹報到",
  "高雄三民區頂級會館 新人見面 8 折",
  "台南東區制服店 純喝酒乾淨",
];

const TAG_POOL = [
  ["冷氣", "停車", "信用卡"],
  ["24h", "現金", "可預約"],
  ["新裝潢", "包廂", "VIP"],
  ["可洗澡", "毛巾", "茶水"],
  ["新妹", "高顏值", "經紀"],
  ["平日特惠", "節日加成", "團體"],
];

const COVERS = [
  "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=540&h=960&fit=crop",
  "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=540&h=960&fit=crop",
  "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=540&h=960&fit=crop",
  "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=540&h=960&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=540&h=960&fit=crop",
  "https://images.unsplash.com/photo-1605762475544-5e9d39d4d35b?w=540&h=960&fit=crop",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=540&h=960&fit=crop",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=540&h=960&fit=crop",
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=540&h=960&fit=crop",
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=540&h=960&fit=crop",
  "https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=540&h=960&fit=crop",
  "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=540&h=960&fit=crop",
];

async function main() {
  // 找一個 BUSINESS 業者，沒有就轉 admin 為業者
  let merchant = await db.user.findFirst({ where: { userType: "BUSINESS" } });
  if (!merchant) {
    const admin = await db.user.findFirst({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } });
    if (!admin) throw new Error("找不到任何 admin user");
    merchant = await db.user.update({
      where: { id: admin.id },
      data: {
        userType: "BUSINESS",
        merchantName: "Demo 業者",
        merchantBio: "示範用業者帳號",
        merchantVerified: true,
      },
    });
    await db.businessWallet.upsert({
      where: { merchantId: merchant.id },
      create: { merchantId: merchant.id, balance: 100000, totalDeposit: 100000 },
      update: { balance: 100000 },
    });
  }

  const forums = await db.forum.findMany({
    where: { slug: { in: FORUM_KEYS } },
    select: { id: true, name: true, slug: true },
  });
  if (forums.length === 0) throw new Error("找不到 massage / bar-uniform 版區");

  const now = new Date();

  // 清掉 demo 帳號的舊廣告（重複跑時冪等）
  await db.businessAd.deleteMany({ where: { merchantId: merchant.id, title: { in: TITLES } } });

  let created = 0;
  for (let i = 0; i < TITLES.length; i++) {
    const tier = TIERS[i % TIERS.length];
    const forum = forums[i % forums.length];
    const [city, district] = CITY_DISTRICTS[i % CITY_DISTRICTS.length];
    const title = TITLES[i];
    const tags = TAG_POOL[i % TAG_POOL.length];
    const expires = new Date(now.getTime() + 30 * 86400000);

    await db.businessAd.create({
      data: {
        merchantId: merchant.id,
        forumId: forum.id,
        title,
        description: `[Demo] ${title}\n\n服務項目：泰式 / 日式 / 全身舒壓\n營業時間：12:00 ~ 04:00\n聯絡方式：請來電預約`,
        city, district,
        tags: tags as any,
        coverImageUrl: COVERS[i % COVERS.length],
        priceMin: 800 + (i * 100),
        priceMax: 1500 + (i * 200),
        ratingAvg: 4 + Math.random(),
        ratingCount: 5 + Math.floor(Math.random() * 50),
        viewCount: 100 + Math.floor(Math.random() * 5000),
        clickCount: Math.floor(Math.random() * 800),
        favoriteCount: Math.floor(Math.random() * 200),
        contactCount: Math.floor(Math.random() * 80),
        tier: tier as any,
        tierAmountTwd: TIER_PRICE[tier],
        status: "ACTIVE",
        publishedAt: now,
        expiresAt: expires,
        sortWeight: TIER_RANK[tier] + Math.random(),
      },
    });
    created++;
  }

  console.log(`✅ 已建立 ${created} 筆 demo 業者廣告 (merchant=${merchant.merchantName ?? merchant.email})`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
