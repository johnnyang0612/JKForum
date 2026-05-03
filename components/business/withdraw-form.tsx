"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BANKS: { code: string; name: string }[] = [
  { code: "004", name: "台灣銀行" },
  { code: "005", name: "土地銀行" },
  { code: "006", name: "合作金庫" },
  { code: "007", name: "第一銀行" },
  { code: "008", name: "華南銀行" },
  { code: "009", name: "彰化銀行" },
  { code: "011", name: "上海商銀" },
  { code: "012", name: "台北富邦" },
  { code: "013", name: "國泰世華" },
  { code: "017", name: "兆豐銀行" },
  { code: "050", name: "台灣企銀" },
  { code: "700", name: "中華郵政" },
  { code: "808", name: "玉山銀行" },
  { code: "812", name: "台新銀行" },
  { code: "822", name: "中國信託" },
];

const MIN_WITHDRAW = 1000;
const FEE = 30;

export function WithdrawForm({ balance }: { balance: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [bankCode, setBankCode] = useState("822");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");

  const max = Math.max(balance - FEE, 0);

  async function submit() {
    if (amount < MIN_WITHDRAW) return toast.error(`最少 NT$ ${MIN_WITHDRAW}`);
    if (amount > max) return toast.error(`餘額不足 (扣手續費 NT$ ${FEE})`);
    if (!bankAccount.trim() || bankAccount.length < 6) return toast.error("帳號無效");
    if (!bankAccountName.trim()) return toast.error("請填戶名");
    setBusy(true);
    try {
      const res = await fetch("/api/business/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, bankCode, bankAccount: bankAccount.trim(), bankAccountName: bankAccountName.trim() }),
      });
      const j = await res.json();
      if (j.success) {
        toast.success("提現申請已送出！");
        setAmount(0); setBankAccount(""); setBankAccountName("");
        router.refresh();
      } else toast.error(j.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs font-medium">提現金額（NT$）</label>
        <input
          type="number" value={amount || ""} min={MIN_WITHDRAW} max={max} step={100}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder={`最少 ${MIN_WITHDRAW}`}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          手續費 NT$ {FEE} · 最高可提 NT$ {max.toLocaleString()}
        </p>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">收款銀行</label>
        <select
          value={bankCode}
          onChange={(e) => setBankCode(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          {BANKS.map((b) => (
            <option key={b.code} value={b.code}>{b.code} {b.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">銀行帳號</label>
        <input
          type="text" value={bankAccount} maxLength={16}
          onChange={(e) => setBankAccount(e.target.value.replace(/[^0-9]/g, ""))}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">戶名</label>
        <input
          type="text" value={bankAccountName} maxLength={50}
          onChange={(e) => setBankAccountName(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <Button className="w-full" onClick={submit} disabled={busy}>
          {busy ? "送出中..." : "送出提現申請"}
        </Button>
      </div>
    </div>
  );
}
