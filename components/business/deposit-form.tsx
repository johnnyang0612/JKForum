"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PRESETS = [500, 1000, 2000, 5000, 10000, 30000];

export function DepositForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState<number>(1000);
  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState<{ discount: number; bonus: number; payable: number; credited: number } | null>(null);

  async function checkCoupon() {
    if (!couponCode.trim()) return;
    const r = await fetch("/api/business/wallet/coupon", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode.trim(), amount }),
    });
    const j = await r.json();
    if (j.success) {
      setCouponInfo({ discount: j.discount, bonus: j.bonus, payable: j.payable, credited: j.credited });
      toast.success("折扣碼有效");
    } else {
      setCouponInfo(null);
      toast.error(j.error);
    }
  }

  async function deposit(value: number) {
    if (value < 100) {
      toast.error("最少 NT$ 100");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/business/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, couponCode: couponCode.trim() || null }),
      });
      const j = await res.json();
      if (j.success && j.redirect) {
        // PAYUNi: 動態建 form 自動 submit
        const form = document.createElement("form");
        form.method = "POST";
        form.action = j.redirect.url;
        for (const [k, v] of Object.entries(j.redirect.fields as Record<string, string>)) {
          const input = document.createElement("input");
          input.type = "hidden"; input.name = k; input.value = v;
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        return;
      }
      if (j.success) {
        toast.success(`儲值成功！+NT$ ${value.toLocaleString()}`);
        router.refresh();
      } else {
        toast.error(j.error ?? "儲值失敗");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(p)}
            className={`rounded-lg border px-2 py-2 text-sm transition ${
              amount === p
                ? "border-primary bg-primary/10 text-primary"
                : "hover:bg-muted"
            }`}
          >
            ${p.toLocaleString()}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          value={amount}
          min={100}
          step={100}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
        />
        <Button onClick={() => deposit(amount)} disabled={busy}>
          {busy ? "處理中..." : `儲值 NT$ ${amount.toLocaleString()}`}
        </Button>
      </div>
      <div className="rounded-lg border border-dashed p-3">
        <label className="block text-xs font-medium">🎁 折扣碼（選填）</label>
        <div className="mt-1 flex gap-1">
          <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="WELCOME100"
            className="flex-1 rounded-md border bg-background px-2 py-1 text-xs font-mono" />
          <button type="button" onClick={checkCoupon}
            className="rounded-md bg-muted px-2 py-1 text-xs hover:bg-muted/80">套用</button>
        </div>
        {couponInfo && (
          <p className="mt-1 text-xs text-emerald-400">
            ✅ 折扣 NT$ {couponInfo.discount} {couponInfo.bonus > 0 && `· 贈 NT$ ${couponInfo.bonus}`}
            {" → "}入帳 NT$ {couponInfo.credited}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        💡 demo 模式：點擊即直接入帳。若已設 PAYUNi key 會跳轉金流頁
      </p>
    </div>
  );
}
