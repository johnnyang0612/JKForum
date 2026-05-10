"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function UserWalletPanel({ userId }: { userId: string }) {
  const { data, isLoading } = useSWR(`/api/admin/users/${userId}/wallet`, fetcher);

  if (isLoading) return <p className="text-sm text-muted-foreground">載入中…</p>;
  if (!data?.wallet) return <p className="text-sm text-muted-foreground">尚未開通業者錢包</p>;

  const w = data.wallet;
  const txs: Array<{
    id: string; type: string; amount: number; balance: number; note: string | null; createdAt: string;
  }> = data.txs ?? [];

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="可用餘額" value={`NT$${w.balance.toLocaleString()}`} highlight />
        <Stat label="凍結中" value={`NT$${(w.frozenBalance ?? 0).toLocaleString()}`} muted />
        <Stat label="累計儲值" value={`NT$${w.totalDeposit.toLocaleString()}`} />
        <Stat label="累計扣款" value={`NT$${w.totalSpent.toLocaleString()}`} />
      </div>

      <div className="rounded-md border">
        <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">最近 30 筆交易</div>
        {txs.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">尚無交易紀錄</div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th className="p-2 text-left">時間</th>
                <th className="p-2 text-left">類型</th>
                <th className="p-2 text-right">金額</th>
                <th className="p-2 text-right">餘額</th>
                <th className="p-2 text-left">備註</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-2 text-muted-foreground">{new Date(t.createdAt).toLocaleString("zh-TW")}</td>
                  <td className="p-2">{t.type}</td>
                  <td className={`p-2 text-right ${t.amount > 0 ? "text-success" : "text-destructive"}`}>
                    {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}
                  </td>
                  <td className="p-2 text-right">{t.balance.toLocaleString()}</td>
                  <td className="p-2 text-muted-foreground">{t.note ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight, muted }: { label: string; value: string; highlight?: boolean; muted?: boolean }) {
  return (
    <div className={`rounded-md border p-2 ${highlight ? "border-primary/40 bg-primary/5" : muted ? "bg-muted/30" : ""}`}>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}
