import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { Star } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "VIP 管理" };

const PLAN_LABELS: Record<string, string> = {
  MONTHLY: "月卡",
  QUARTERLY: "季卡",
  YEARLY: "年卡",
};

const PLAN_PRICE: Record<string, number> = {
  MONTHLY: 99,
  QUARTERLY: 249,
  YEARLY: 799,
};

export default async function AdminVipPage() {
  const subs = await db.vipSubscription.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
        },
      },
    },
  });

  const totalRevenue = subs.reduce(
    (s, sub) => s + (PLAN_PRICE[sub.plan] || 0),
    0
  );

  const now = new Date();
  const activeSubs = subs.filter((s) => s.status === "ACTIVE" && s.endDate > now);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-500" />
          VIP 管理
        </h1>
      </div>

      <div className="grid gap-4 grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">當前訂閱數</div>
          <div className="mt-1 text-2xl font-bold text-emerald-500">
            {activeSubs.length}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">歷史訂閱總數</div>
          <div className="mt-1 text-2xl font-bold">{subs.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">累計營收（NT$）</div>
          <div className="mt-1 text-2xl font-bold">
            {formatNumber(totalRevenue)}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">用戶</th>
              <th className="p-3">方案</th>
              <th className="p-3 text-right">金額</th>
              <th className="p-3">開始</th>
              <th className="p-3">到期</th>
              <th className="p-3 text-center">狀態</th>
            </tr>
          </thead>
          <tbody>
            {subs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-muted-foreground"
                >
                  尚無 VIP 訂閱記錄
                </td>
              </tr>
            ) : (
              subs.map((s) => {
                const expired = s.endDate <= now;
                return (
                  <tr
                    key={s.id}
                    className="border-t transition-colors hover:bg-muted/30"
                  >
                    <td className="p-3">
                      <div className="font-medium">{s.user.displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        @{s.user.username}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">
                        {PLAN_LABELS[s.plan] || s.plan}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-mono">
                      NT${formatNumber(PLAN_PRICE[s.plan] || 0)}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatDate(s.startDate)}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatDate(s.endDate)}
                    </td>
                    <td className="p-3 text-center">
                      {s.status === "ACTIVE" && !expired ? (
                        <Badge variant="success">有效</Badge>
                      ) : s.status === "CANCELLED" ? (
                        <Badge variant="destructive">已取消</Badge>
                      ) : (
                        <Badge variant="secondary">已過期</Badge>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
