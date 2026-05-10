import Link from "next/link";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "VIP 訂閱者" };

export default async function AdminVipSubscribersPage({
  searchParams,
}: { searchParams: { status?: string; page?: string } }) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 50;
  const status = searchParams.status;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [subs, total, activeCount, expiredCount] = await Promise.all([
    db.vipSubscription.findMany({
      where,
      orderBy: { startDate: "desc" },
      skip: (page - 1) * limit, take: limit,
      include: { user: { select: { id: true, displayName: true, email: true } } },
    }),
    db.vipSubscription.count({ where }),
    db.vipSubscription.count({ where: { status: "ACTIVE", endDate: { gt: new Date() } } }),
    db.vipSubscription.count({ where: { OR: [{ status: { in: ["EXPIRED", "CANCELLED"] } }, { endDate: { lte: new Date() } }] } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">⭐ VIP 訂閱者</h1>
        <p className="text-sm text-muted-foreground mt-1">
          有效中：<strong className="text-success">{activeCount}</strong> ·
          已過期/取消：{expiredCount} · 總計 {total}
        </p>
      </div>

      <div className="flex gap-2 text-sm">
        <Link href="/admin/vip-subscribers" className={`rounded border px-3 py-1 ${!status ? "bg-primary text-primary-foreground" : ""}`}>全部</Link>
        <Link href="/admin/vip-subscribers?status=ACTIVE" className={`rounded border px-3 py-1 ${status === "ACTIVE" ? "bg-primary text-primary-foreground" : ""}`}>有效中</Link>
        <Link href="/admin/vip-subscribers?status=EXPIRED" className={`rounded border px-3 py-1 ${status === "EXPIRED" ? "bg-primary text-primary-foreground" : ""}`}>已過期</Link>
        <Link href="/admin/vip-subscribers?status=CANCELLED" className={`rounded border px-3 py-1 ${status === "CANCELLED" ? "bg-primary text-primary-foreground" : ""}`}>已取消</Link>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-2 text-left">使用者</th>
              <th className="p-2 text-left">方案</th>
              <th className="p-2 text-left">狀態</th>
              <th className="p-2 text-left">起始</th>
              <th className="p-2 text-left">到期</th>
              <th className="p-2 text-left">自動續訂</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-b hover:bg-muted/20">
                <td className="p-2">
                  <Link href={`/admin/users/${s.user.id}`} className="text-primary hover:underline">
                    {s.user.displayName}
                  </Link>
                  <p className="text-xs text-muted-foreground">{s.user.email}</p>
                </td>
                <td className="p-2">{s.plan}</td>
                <td className="p-2 text-xs">
                  <span className={`rounded px-1.5 py-0.5 ${
                    s.status === "ACTIVE" && s.endDate > new Date()
                      ? "bg-success/10 text-success"
                      : "bg-muted"
                  }`}>{s.status}</span>
                </td>
                <td className="p-2 text-xs">{new Date(s.startDate).toLocaleDateString("zh-TW")}</td>
                <td className="p-2 text-xs">{new Date(s.endDate).toLocaleDateString("zh-TW")}</td>
                <td className="p-2 text-xs">{s.autoRenew ? "✓" : "-"}</td>
              </tr>
            ))}
            {subs.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">無 VIP 訂閱者</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 && <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}`} className="rounded border px-3 py-1">上一頁</Link>}
          <span className="px-3 py-1">{page} / {totalPages}</span>
          {page < totalPages && <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`} className="rounded border px-3 py-1">下一頁</Link>}
        </div>
      )}
    </div>
  );
}
