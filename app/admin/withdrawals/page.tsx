/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { db } from "@/lib/db";
import { Banknote } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { WithdrawReviewActions } from "@/components/admin/withdraw-review-actions";

export const dynamic = "force-dynamic";

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status ?? "PENDING";
  const [list, counts] = await Promise.all([
    db.withdrawalRequest.findMany({
      where: status === "ALL" ? {} : { status: status as any },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.withdrawalRequest.groupBy({ by: ["status"], _count: true }),
  ]);

  const merchantIds = Array.from(new Set(list.map(w => w.merchantId)));
  const merchants = merchantIds.length
    ? await db.user.findMany({ where: { id: { in: merchantIds } }, select: { id: true, merchantName: true, displayName: true, email: true } })
    : [];
  const merchantMap = new Map(merchants.map(m => [m.id, m]));
  const countMap: Record<string, number> = {};
  for (const c of counts) countMap[c.status] = c._count;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Banknote className="h-7 w-7 text-primary" /> 提現審核
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          核准 → 撥款（已從錢包扣款）；退回 → 將金額退回錢包
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {["PENDING", "APPROVED", "PAID", "REJECTED", "ALL"].map((s) => (
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
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">無資料</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="px-3 py-2 text-left">業者</th>
                <th className="px-3 py-2 text-right">金額</th>
                <th className="px-3 py-2 text-left">收款資訊</th>
                <th className="px-3 py-2 text-center">狀態</th>
                <th className="px-3 py-2 text-right">申請</th>
                <th className="px-3 py-2 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((w) => {
                const m = merchantMap.get(w.merchantId);
                return (
                  <tr key={w.id} className="border-t">
                    <td className="px-3 py-2 text-xs">
                      <p className="font-medium">{m?.merchantName ?? m?.displayName}</p>
                      <p className="text-muted-foreground">{m?.email}</p>
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-mono">
                      NT$ {formatNumber(w.amount)}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <p>{w.bankCode} {w.bankAccount}</p>
                      <p className="text-muted-foreground">戶名：{w.bankAccountName}</p>
                    </td>
                    <td className="px-3 py-2 text-center text-xs">{w.status}</td>
                    <td className="px-3 py-2 text-right text-xs">{formatDate(w.createdAt)}</td>
                    <td className="px-3 py-2 text-center">
                      <WithdrawReviewActions wrId={w.id} status={w.status} />
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
