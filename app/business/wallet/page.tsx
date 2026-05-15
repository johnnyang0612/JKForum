/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatNumber } from "@/lib/utils/format";
import { DepositForm } from "@/components/business/deposit-form";

export const dynamic = "force-dynamic";

export default async function BusinessWalletPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const [wallet, txList] = await Promise.all([
    db.businessWallet.findUnique({ where: { merchantId: session.user.id } }),
    db.businessWalletTx.findMany({
      where: { merchantId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">💰 論壇點數</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          充點 / 廣告扣點 / 退點 紀錄
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6">
          <p className="text-sm text-muted-foreground">當前點數</p>
          <p className="mt-2 text-4xl font-bold text-emerald-400">
            {formatNumber(wallet?.balance ?? 0)} 點
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            累積充點 {formatNumber(wallet?.totalDeposit ?? 0)} 點 · 累積消費 {formatNumber(wallet?.totalSpent ?? 0)} 點
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <h3 className="font-bold">💵 充點（測試模式）</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            點擊金額即直接到帳（demo 用，正式上線會接 PAYUNi）
          </p>
          <DepositForm />
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-bold">📋 交易紀錄</h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[500px] text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="px-3 py-2 text-left">類型</th>
                <th className="px-3 py-2 text-left">說明</th>
                <th className="px-3 py-2 text-right">金額</th>
                <th className="px-3 py-2 text-right">時間</th>
              </tr>
            </thead>
            <tbody>
              {txList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-muted-foreground">
                    尚無交易
                  </td>
                </tr>
              ) : (
                txList.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="px-3 py-2 text-xs">{txLabel(t.type)}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{t.note ?? "—"}</td>
                    <td className={`px-3 py-2 text-right text-xs font-mono ${t.amount > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {t.amount > 0 ? "+" : ""}{formatNumber(t.amount)}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
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

function txLabel(t: string): string {
  return {
    DEPOSIT: "💵 充點", AD_PAYMENT: "📣 廣告扣點",
    REFUND: "💰 退點", WITHDRAWAL: "🏦 提現",
    ADMIN_ADJUST: "⚙️ 管理調整",
  }[t] ?? t;
}
