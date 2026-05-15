/* eslint-disable */
import { db } from "../lib/db";

(async () => {
  console.log("== Seed Demo Promotions / Pinned / Vouchers ==\n");

  const admin = await db.user.findFirst({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } });
  const mods = await db.user.findMany({ where: { role: "MODERATOR" } });
  if (!admin) throw new Error("找不到 admin");
  console.log(`admin: ${admin.username}, mods: ${mods.length}`);

  const forums = await db.forum.findMany({
    where: { isVisible: true },
    select: { id: true, name: true, slug: true, categoryId: true },
    take: 30,
  });
  console.log(`forums: ${forums.length}`);

  const allPosts = await db.post.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, title: true, forumId: true, authorId: true },
    take: 200,
    orderBy: { createdAt: "desc" },
  });
  console.log(`posts: ${allPosts.length}`);

  const byForum: Record<string, typeof allPosts> = {};
  for (const p of allPosts) (byForum[p.forumId] ||= []).push(p);

  // === 1. 版內置頂（每個版區挑 1-2 篇）— 模擬版主 / 站長置頂 ===
  let forumPinCount = 0;
  for (const f of forums) {
    const posts = (byForum[f.id] ?? []).slice(0, 2);
    for (const p of posts) {
      const endAt = new Date(Date.now() + 7 * 86400000);
      await db.post.update({
        where: { id: p.id },
        data: { isPinned: true, pinnedAt: new Date() },
      });
      await db.promotionOrder.create({
        data: {
          postId: p.id,
          userId: p.authorId,
          type: "FORUM_PIN_7D",
          status: "ACTIVE",
          paymentMethod: "ADMIN_GIFT",
          priceCoins: 0,
          priceTwd: 0,
          startAt: new Date(),
          endAt,
          paidAt: new Date(),
          note: "[DEMO] 版內置頂示範",
        },
      });
      forumPinCount++;
    }
  }
  console.log(`✓ 版內置頂：${forumPinCount} 篇`);

  // === 2. 大分類置頂（找 3 篇）===
  const cat3 = allPosts.slice(2, 5);
  for (const p of cat3) {
    await db.post.update({
      where: { id: p.id },
      data: { isPinned: true, pinnedAt: new Date() },
    });
    await db.promotionOrder.create({
      data: {
        postId: p.id, userId: p.authorId,
        type: "CATEGORY_PIN_3D", status: "ACTIVE", paymentMethod: "COINS",
        priceCoins: 2500, priceTwd: 0,
        startAt: new Date(), endAt: new Date(Date.now() + 3 * 86400000), paidAt: new Date(),
        note: "[DEMO] 大分類置頂",
      },
    });
  }
  console.log(`✓ 大分類置頂：${cat3.length} 篇`);

  // === 3. 首頁精華（5 篇）===
  const featured5 = allPosts.slice(5, 10);
  for (const p of featured5) {
    await db.post.update({
      where: { id: p.id },
      data: { isFeatured: true, featuredAt: new Date() },
    });
    await db.promotionOrder.create({
      data: {
        postId: p.id, userId: p.authorId,
        type: "HOME_FEATURED_7D", status: "ACTIVE", paymentMethod: "ECPAY",
        priceCoins: 0, priceTwd: 500,
        startAt: new Date(), endAt: new Date(Date.now() + 7 * 86400000), paidAt: new Date(),
        note: "[DEMO] 首頁精華推薦",
      },
    });
  }
  console.log(`✓ 首頁精華：${featured5.length} 篇`);

  // === 4. 首頁 Hero（4 篇）===
  const hero4 = allPosts.slice(10, 14);
  for (const p of hero4) {
    await db.post.update({
      where: { id: p.id },
      data: { isFeatured: true, featuredAt: new Date(), isHighlighted: true, highlightColor: "#f59e0b" },
    });
    await db.promotionOrder.create({
      data: {
        postId: p.id, userId: p.authorId,
        type: "HOME_HERO_7D", status: "ACTIVE", paymentMethod: "NEWEBPAY",
        priceCoins: 0, priceTwd: 3000,
        startAt: new Date(), endAt: new Date(Date.now() + 7 * 86400000), paidAt: new Date(),
        note: "[DEMO] 首頁 Hero 輪播",
      },
    });
  }
  console.log(`✓ 首頁 Hero：${hero4.length} 篇`);

  // === 5. 全站熱門推（2 篇）===
  const hot2 = allPosts.slice(14, 16);
  for (const p of hot2) {
    await db.post.update({
      where: { id: p.id },
      data: { isFeatured: true, featuredAt: new Date(), isHighlighted: true, highlightColor: "#ef4444" },
    });
    await db.promotionOrder.create({
      data: {
        postId: p.id, userId: p.authorId,
        type: "HOT_TOP_24H", status: "ACTIVE", paymentMethod: "STRIPE",
        priceCoins: 0, priceTwd: 5000,
        startAt: new Date(), endAt: new Date(Date.now() + 86400000), paidAt: new Date(),
        note: "[DEMO] 全站熱門推",
      },
    });
  }
  console.log(`✓ 全站熱門推：${hot2.length} 篇`);

  // === 6. Admin 發 5 張未使用置頂卡（演示 voucher 流程）===
  const sources = ["連續簽到 30 天", "完成達人任務", "VIP 月卡贈送", "推廣 5 個新會員", "充值送"];
  const types: Array<"FORUM_PIN_24H" | "FORUM_PIN_7D" | "HOME_FEATURED_7D"> = [
    "FORUM_PIN_24H", "FORUM_PIN_7D", "HOME_FEATURED_7D", "FORUM_PIN_24H", "FORUM_PIN_7D",
  ];
  for (let i = 0; i < 5; i++) {
    await db.promotionVoucher.create({
      data: {
        userId: admin.id,
        type: types[i],
        source: sources[i],
        expiresAt: new Date(Date.now() + 30 * 86400000),
      },
    });
  }
  console.log(`✓ admin 置頂卡：5 張`);

  // === 7. 過期歷史訂單（讓後台訂單列表有歷史紀錄）===
  for (let i = 0; i < 8; i++) {
    const p = allPosts[16 + i];
    if (!p) break;
    const startAt = new Date(Date.now() - (10 + i) * 86400000);
    await db.promotionOrder.create({
      data: {
        postId: p.id, userId: p.authorId,
        type: i % 2 === 0 ? "FORUM_PIN_24H" : "FORUM_PIN_7D",
        status: "EXPIRED",
        paymentMethod: i % 3 === 0 ? "COINS" : "ECPAY",
        priceCoins: i % 3 === 0 ? 100 : 0,
        priceTwd: i % 3 === 0 ? 0 : 30,
        startAt,
        endAt: new Date(startAt.getTime() + 86400000),
        paidAt: startAt,
        note: "[DEMO] 歷史訂單",
      },
    });
  }
  console.log(`✓ 歷史訂單：8 筆`);

  // === 8. 版主指派（mods 各派 2 個版區）===
  let modAssignCount = 0;
  for (let i = 0; i < mods.length; i++) {
    const m = mods[i];
    const targetForums = forums.slice(i * 2, i * 2 + 2);
    for (const f of targetForums) {
      try {
        await db.forumModerator.create({
          data: { forumId: f.id, userId: m.id },
        });
        modAssignCount++;
      } catch {}
    }
  }
  console.log(`✓ 版主指派：${modAssignCount} 筆`);

  console.log("\n=== 完成 ===");
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
