import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils/format";
import { Gift, Coins, Star } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "商城管理" };

const CATEGORY_LABELS: Record<string, string> = {
  BOOST: "加成道具",
  BADGE: "徽章",
  FEATURE: "功能解鎖",
};

export default async function AdminShopPage() {
  const items = await db.shopItem.findMany({
    orderBy: [{ isActive: "desc" }, { price: "asc" }],
    include: {
      _count: { select: { purchases: true } },
    },
  });

  const stats = {
    total: items.length,
    active: items.filter((i) => i.isActive).length,
    purchases: items.reduce((s, i) => s + i._count.purchases, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gift className="h-6 w-6" />
          商城管理
        </h1>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">商品總數</div>
          <div className="mt-1 text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">上架中</div>
          <div className="mt-1 text-2xl font-bold text-emerald-500">
            {stats.active}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">累計購買次數</div>
          <div className="mt-1 text-2xl font-bold">
            {formatNumber(stats.purchases)}
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">商品</th>
              <th className="p-3">分類</th>
              <th className="p-3">價格</th>
              <th className="p-3 text-center">購買次數</th>
              <th className="p-3 text-center">狀態</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  尚無商品
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t transition-colors hover:bg-muted/30"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Star className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary">
                      {CATEGORY_LABELS[item.type] || item.type}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 font-medium">
                      <Coins className="h-3.5 w-3.5 text-amber-500" />
                      {formatNumber(item.price)}
                      <span className="text-xs text-muted-foreground">
                        {item.currency === "PLATINUM" ? "白金幣" : "金幣"}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    {formatNumber(item._count.purchases)}
                  </td>
                  <td className="p-3 text-center">
                    {item.isActive ? (
                      <Badge variant="success">上架中</Badge>
                    ) : (
                      <Badge variant="secondary">已下架</Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        💡 商品為系統內建（9 項），若需新增 / 下架請透過 DB 直接操作（未來版可加編輯 UI）。
      </p>
    </div>
  );
}
