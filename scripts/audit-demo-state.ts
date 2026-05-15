/* eslint-disable */
import { db } from "../lib/db";

(async () => {
  console.log("\n=== 1. 業者廣告（依 Tier 分布）===");
  const ads = await db.businessAd.groupBy({
    by: ["tier"],
    _count: { _all: true },
    where: { status: "ACTIVE" },
  });
  console.table(ads.map((a) => ({ tier: a.tier, count: a._count._all })));

  console.log("\n=== 2. 文章置頂狀況 ===");
  const pinned = await db.post.count({ where: { isPinned: true } });
  const featured = await db.post.count({ where: { isFeatured: true } });
  const highlighted = await db.post.count({ where: { isHighlighted: true } });
  console.log({ isPinned: pinned, isFeatured: featured, isHighlighted: highlighted });

  console.log("\n=== 3. 推廣訂單 ===");
  const promos = await db.promotionOrder.groupBy({
    by: ["type", "status"],
    _count: { _all: true },
  });
  console.table(promos.map((p) => ({ type: p.type, status: p.status, count: p._count._all })));

  console.log("\n=== 4. 未使用置頂卡 voucher ===");
  const vouchers = await db.promotionVoucher.count({ where: { usedAt: null } });
  console.log("未使用：", vouchers);

  console.log("\n=== 5. 版主 / 管理員 ===");
  const mods = await db.user.findMany({
    where: { role: { in: ["MODERATOR", "ADMIN"] } },
    select: { username: true, role: true },
  });
  console.table(mods);

  console.log("\n=== 6. 置頂文章樣本（前 10 筆）===");
  const pinnedSample = await db.post.findMany({
    where: { isPinned: true },
    select: { id: true, title: true, forum: { select: { name: true } }, isPinned: true, isFeatured: true, isHighlighted: true },
    take: 10,
  });
  console.table(
    pinnedSample.map((p) => ({
      forum: p.forum?.name ?? "?",
      title: p.title.slice(0, 30),
      pin: p.isPinned ? "✓" : "",
      featured: p.isFeatured ? "✓" : "",
      hi: p.isHighlighted ? "✓" : "",
    })),
  );

  console.log("\n=== 7. 開放付費刊登的板區 ===");
  const paidForums = await db.forum.findMany({
    where: { allowPaidListing: true },
    select: { name: true, slug: true },
  });
  console.table(paidForums);

  console.log("\n=== 8. ForumModerator（版主指派）===");
  const fm = await db.forumModerator.count();
  console.log("指派紀錄：", fm);

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
