/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { db } from "@/lib/db";
import { Megaphone, Coins, DollarSign, Ticket } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "推廣訂單" };

const TYPE_LABELS: Record<string, string> = {
  FORUM_PIN_24H: "📌 版內 24h",
  FORUM_PIN_7D: "📍 版內 7d",
  CATEGORY_PIN_3D: "🏷️ 分類 3d",
  HOME_FEATURED_7D: "⭐ 首頁精華 7d",
  HOME_HERO_7D: "🎯 Hero 7d",
  HOT_TOP_24H: "🔥 熱門 24h",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-400",
  ACTIVE: "bg-emerald-500/10 text-emerald-400",
  EXPIRED: "bg-zinc-500/10 text-zinc-400",
  CANCELLED: "bg-rose-500/10 text-rose-400",
};

export default async function AdminPromotionsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 30;
  const status = searchParams.status;

  const where: any = {};
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    db.promotionOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.promotionOrder.count({ where }),
  ]);

  // 補抓 user/post 資訊
  const userIds = Array.from(new Set(orders.map((o) => o.userId)));
  const postIds = Array.from(new Set(orders.map((o) => o.postId)));
  const [users, posts] = await Promise.all([
    db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, displayName: true },
    }),
    db.post.findMany({
      where: { id: { in: postIds } },
      select: { id: true, title: true },
    }),
  ]);
  const userMap = new Map(users.map((u) => [u.id, u]));
  const postMap = new Map(posts.map((p) => [p.id, p]));

  // 統計
  const [totalCount, activeCount, voucherCount, totalCoinsRevenue, totalTwdRevenue] = await Promise.all([
    db.promotionOrder.count(),
    db.promotionOrder.count({ where: { status: "ACTIVE" } }),
    db.promotionVoucher.count({ where: { usedAt: null } }),
    db.promotionOrder.aggregate({ _sum: { priceCoins: true } }),
    db.promotionOrder.aggregate({ _sum: { priceTwd: true } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Megaphone className="h-7 w-7 text-primary" />
          推廣訂單
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          管理用戶購買的置頂方案 + 廣告營收
        </p>
      </header>

      {/* 統計卡 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">總訂單</p>
          <p className="mt-1 text-2xl font-bold">{totalCount}</p>
        </div>
        <div className="rounded-xl border bg-emerald-500/10 p-4">
          <p className="text-xs text-muted-foreground">進行中</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{activeCount}</p>
        </div>
        <div className="rounded-xl border bg-amber-500/10 p-4">
          <p className="text-xs text-muted-foreground">
            <Coins className="inline h-3 w-3" /> 金幣收入
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-400">
            {(totalCoinsRevenue._sum.priceCoins ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border bg-blue-500/10 p-4">
          <p className="text-xs text-muted-foreground">
            <DollarSign className="inline h-3 w-3" /> 真金額（TWD）
          </p>
          <p className="mt-1 text-2xl font-bold text-blue-400">
            ${(totalTwdRevenue._sum.priceTwd ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border bg-fuchsia-500/10 p-4">
          <p className="text-xs text-muted-foreground">
            <Ticket className="inline h-3 w-3" /> 待用置頂卡
          </p>
          <p className="mt-1 text-2xl font-bold text-fuchsia-400">{voucherCount}</p>
        </div>
      </div>

      {/* 篩選 */}
      <div className="flex gap-2">
        {["", "PENDING", "ACTIVE", "EXPIRED", "CANCELLED"].map((s) => (
          <Link
            key={s || "all"}
            href={s ? `/admin/promotions?status=${s}` : "/admin/promotions"}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              (status ?? "") === s ? "border-primary bg-primary/10 text-primary" : ""
            }`}
          >
            {s === "" ? "全部" : s}
          </Link>
        ))}
      </div>

      {/* 訂單列表 */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-muted/50 text-xs">
            <tr>
              <th className="px-3 py-2 text-left">類型</th>
              <th className="px-3 py-2 text-left">文章</th>
              <th className="px-3 py-2 text-left">購買人</th>
              <th className="px-3 py-2 text-right">金幣 / TWD</th>
              <th className="px-3 py-2 text-center">付款方式</th>
              <th className="px-3 py-2 text-center">狀態</th>
              <th className="px-3 py-2 text-right">到期</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  暫無訂單
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const u = userMap.get(o.userId);
                const p = postMap.get(o.postId);
                return (
                  <tr key={o.id} className="border-t hover:bg-muted/20">
                    <td className="px-3 py-2 whitespace-nowrap">{TYPE_LABELS[o.type] ?? o.type}</td>
                    <td className="px-3 py-2 max-w-[200px] truncate">
                      <Link href={`/posts/${o.postId}`} target="_blank" className="hover:text-primary">
                        {p?.title ?? o.postId.slice(0, 10)}
                      </Link>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {u ? (
                        <Link href={`/admin/users/${u.id}`} className="hover:text-primary">
                          {u.displayName} <span className="opacity-60">@{u.username}</span>
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-xs">
                      <div>🪙 {o.priceCoins.toLocaleString()}</div>
                      {o.priceTwd > 0 && <div className="text-muted-foreground">${o.priceTwd}</div>}
                    </td>
                    <td className="px-3 py-2 text-center text-xs">{o.paymentMethod}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[o.status]}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                      {o.endAt ? new Date(o.endAt).toLocaleString("zh-TW", { month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" }) : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">共 {total} 筆，第 {page}/{totalPages} 頁</span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link href={`/admin/promotions?page=${page - 1}${status ? `&status=${status}` : ""}`} className="rounded border px-3 py-1.5">
              上一頁
            </Link>
          )}
          {page < totalPages && (
            <Link href={`/admin/promotions?page=${page + 1}${status ? `&status=${status}` : ""}`} className="rounded border px-3 py-1.5">
              下一頁
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
