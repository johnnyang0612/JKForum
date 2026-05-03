/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { db } from "@/lib/db";
import { Building2 } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { BusinessAdReviewActions } from "@/components/admin/business-ad-review-actions";

export const dynamic = "force-dynamic";

export default async function AdminBusinessAdsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status ?? "PENDING";

  const [list, counts] = await Promise.all([
    db.businessAd.findMany({
      where: status === "ALL" ? {} : { status: status as any },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    }),
    db.businessAd.groupBy({ by: ["status"], _count: true }),
  ]);

  const merchantIds = Array.from(new Set(list.map(a => a.merchantId)));
  const forumIds = Array.from(new Set(list.map(a => a.forumId)));
  const [merchants, forums] = await Promise.all([
    merchantIds.length ? db.user.findMany({ where: { id: { in: merchantIds } }, select: { id: true, merchantName: true, displayName: true, merchantVerified: true } }) : Promise.resolve([]),
    forumIds.length ? db.forum.findMany({ where: { id: { in: forumIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
  ]);
  const merchantMap = new Map(merchants.map(m => [m.id, m]));
  const forumMap = new Map(forums.map(f => [f.id, f]));

  const countMap: Record<string, number> = {};
  for (const c of counts) countMap[c.status] = c._count;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Building2 className="h-7 w-7 text-primary" /> 業者刊登審核
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          通過 → ACTIVE 並啟動 30 天倒數；退回 → 退款給業者錢包
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {["PENDING", "ACTIVE", "REJECTED", "EXPIRED", "TAKEN_DOWN", "REMOVED", "ALL"].map((s) => (
          <Link
            key={s} href={`?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs ${
              status === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            }`}
          >
            {s} ({s === "ALL" ? Object.values(countMap).reduce((a, b) => a + b, 0) : (countMap[s] ?? 0)})
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          無資料
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="px-3 py-2 text-left">封面</th>
                <th className="px-3 py-2 text-left">標題 / 業者</th>
                <th className="px-3 py-2 text-left">版區 / 地點</th>
                <th className="px-3 py-2 text-center">層級</th>
                <th className="px-3 py-2 text-right">金額</th>
                <th className="px-3 py-2 text-right">建立</th>
                <th className="px-3 py-2 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => {
                const m = merchantMap.get(a.merchantId);
                const f = forumMap.get(a.forumId);
                return (
                  <tr key={a.id} className="border-t">
                    <td className="px-3 py-2">
                      {a.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.coverImageUrl} alt="" className="h-16 w-9 rounded object-cover" />
                      ) : <div className="h-16 w-9 rounded bg-muted" />}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <Link href={`/admin/business-ads/${a.id}`} className="font-medium hover:text-primary">
                        {a.title}
                      </Link>
                      <div className="mt-0.5 text-muted-foreground">
                        {m?.merchantName ?? m?.displayName ?? "—"}
                        {m?.merchantVerified && <span className="ml-1 text-emerald-400">✓</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {f?.name ?? "—"}
                      <div className="mt-0.5 text-muted-foreground">{a.city} {a.district}</div>
                    </td>
                    <td className="px-3 py-2 text-center text-xs">{a.tier}</td>
                    <td className="px-3 py-2 text-right text-xs font-mono">
                      NT$ {formatNumber(a.tierAmountTwd)}
                    </td>
                    <td className="px-3 py-2 text-right text-xs">{formatDate(a.createdAt)}</td>
                    <td className="px-3 py-2 text-center">
                      <BusinessAdReviewActions adId={a.id} status={a.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
