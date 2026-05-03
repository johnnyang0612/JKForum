/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatNumber } from "@/lib/utils/format";
import { WithdrawForm } from "@/components/business/withdraw-form";

export const dynamic = "force-dynamic";

export default async function BusinessWithdrawPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const [wallet, list] = await Promise.all([
    db.businessWallet.findUnique({ where: { merchantId: session.user.id } }),
    db.withdrawalRequest.findMany({
      where: { merchantId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const balance = wallet?.balance ?? 0;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">🏦 提現申請</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          可提餘額 NT$ {formatNumber(balance)}
        </p>
      </header>

      <div className="rounded-2xl border bg-card p-6">
        <h3 className="font-bold">填寫提現資訊</h3>
        <WithdrawForm balance={balance} />
      </div>

      <section>
        <h2 className="mb-3 font-bold">📋 申請紀錄</h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="px-3 py-2 text-left">申請時間</th>
                <th className="px-3 py-2 text-right">金額</th>
                <th className="px-3 py-2 text-left">收款帳戶</th>
                <th className="px-3 py-2 text-center">狀態</th>
                <th className="px-3 py-2 text-left">備註</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                    尚未提出申請
                  </td>
                </tr>
              ) : (
                list.map((w) => (
                  <tr key={w.id} className="border-t">
                    <td className="px-3 py-2 text-xs">
                      {new Date(w.createdAt).toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-mono">
                      NT$ {formatNumber(w.amount)}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {w.bankCode} / {w.bankAccount.slice(-4).padStart(w.bankAccount.length, "*")}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor(w.status)}`}>
                        {statusLabel(w.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {w.rejectReason ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function statusColor(s: string): string {
  return {
    PENDING: "bg-amber-500/10 text-amber-400",
    APPROVED: "bg-emerald-500/10 text-emerald-400",
    REJECTED: "bg-rose-500/10 text-rose-400",
    PAID: "bg-emerald-500/20 text-emerald-300",
  }[s] ?? "bg-muted text-muted-foreground";
}
function statusLabel(s: string): string {
  return {
    PENDING: "待審", APPROVED: "已核准", REJECTED: "已退回", PAID: "已撥款",
  }[s] ?? s;
}
