import { db } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "充值紀錄" };

const TX_LABEL: Record<string, string> = {
  DEPOSIT: "💰 儲值",
  AD_PAYMENT: "💸 廣告扣款",
  REFUND: "↩️ 退款",
  WITHDRAWAL: "🏦 提現",
  ADMIN_ADJUST: "🛠️ 管理員調整",
};

export default async function AdminWalletTxPage({
  searchParams,
}: {
  searchParams: { type?: string; merchantId?: string; page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const pageSize = 50;

  const where: Record<string, unknown> = {};
  if (searchParams.type) where.type = searchParams.type;
  if (searchParams.merchantId) where.merchantId = searchParams.merchantId;

  const [txs, total, sum30d] = await Promise.all([
    db.businessWalletTx.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.businessWalletTx.count({ where }),
    db.businessWalletTx.aggregate({
      where: { type: "DEPOSIT", createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
      _sum: { amount: true },
    }),
  ]);

  const merchantIds = Array.from(new Set(txs.map((t) => t.merchantId)));
  const merchants = await db.user.findMany({
    where: { id: { in: merchantIds } },
    select: { id: true, displayName: true, merchantName: true, email: true },
  });
  const mMap = Object.fromEntries(merchants.map((m) => [m.id, m]));

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">充值紀錄 / 業者錢包交易</h1>
        <p className="text-sm text-muted-foreground mt-1">
          30 天內儲值總額：<strong className="text-success">NT${(sum30d._sum.amount ?? 0).toLocaleString()}</strong>
          ・共 {total.toLocaleString()} 筆交易
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/wallet-transactions"
          className={`rounded-md border px-3 py-1 ${!searchParams.type ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
          全部
        </Link>
        {Object.entries(TX_LABEL).map(([k, v]) => (
          <Link key={k} href={`/admin/wallet-transactions?type=${k}`}
            className={`rounded-md border px-3 py-1 ${searchParams.type === k ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            {v}
          </Link>
        ))}
      </div>

      <div className="md:overflow-x-auto md:rounded-lg md:border">
        <table className="responsive-table w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-2 text-left">時間</th>
              <th className="p-2 text-left">業者</th>
              <th className="p-2 text-left">類型</th>
              <th className="p-2 text-right">金額</th>
              <th className="p-2 text-right">餘額</th>
              <th className="p-2 text-left">關聯</th>
              <th className="p-2 text-left">備註</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((t) => {
              const m = mMap[t.merchantId];
              return (
                <tr key={t.id} className="border-b hover:bg-muted/20">
                  <td data-label="時間" className="p-2 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(t.createdAt).toLocaleString("zh-TW")}
                  </td>
                  <td data-label="業者" className="p-2">
                    <div className="flex flex-col items-end md:items-start">
                      <Link href={`/admin/users/${t.merchantId}`} className="text-primary hover:underline">
                        {m?.merchantName || m?.displayName || t.merchantId.slice(0, 8)}
                      </Link>
                      {m && <div className="text-xs text-muted-foreground">{m.email}</div>}
                    </div>
                  </td>
                  <td data-label="類型" className="p-2">{TX_LABEL[t.type] ?? t.type}</td>
                  <td data-label="金額" className={`p-2 text-right font-mono ${t.amount > 0 ? "text-success" : "text-destructive"}`}>
                    {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}
                  </td>
                  <td data-label="餘額" className="p-2 text-right font-mono">{t.balance.toLocaleString()}</td>
                  <td data-label="關聯" className="p-2 text-xs font-mono text-muted-foreground">{t.relatedId ?? "-"}</td>
                  <td data-label="備註" className="p-2 text-xs text-muted-foreground">{t.note ?? "-"}</td>
                </tr>
              );
            })}
            {txs.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">無資料</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}`}
              className="rounded border px-3 py-1 hover:bg-muted">上一頁</Link>
          )}
          <span className="px-3 py-1">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`}
              className="rounded border px-3 py-1 hover:bg-muted">下一頁</Link>
          )}
        </div>
      )}
    </div>
  );
}
