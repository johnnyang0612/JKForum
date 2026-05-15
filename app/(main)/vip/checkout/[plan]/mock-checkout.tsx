"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Check, CreditCard, Shield, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  planKey: string;
  label: string;
  price: number;
  duration: string;
  extras: string[];
}

export function MockCheckout({
  planKey,
  label,
  price,
  duration,
  extras,
}: Props) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);

  const pay = async () => {
    if (!agreed) {
      toast.error("請先勾選同意條款");
      return;
    }
    setProcessing(true);
    // Artificial delay to feel like a real payment
    await new Promise((r) => setTimeout(r, 1200));
    try {
      const r = await fetch("/api/vip/mock-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "付款失敗");
      toast.success(`🎉 ${data.label} 開通成功！有效至 ${new Date(data.endDate).toLocaleDateString("zh-TW")}`);
      router.push("/vip");
      router.refresh();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回方案選擇
      </button>

      <div className="overflow-hidden rounded-2xl border shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-white">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">{label}</h1>
              <p className="text-sm opacity-90">有效期 {duration}</p>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-5xl font-bold">{price}</span>
            <span className="text-2xl font-bold">點</span>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-card p-6 space-y-3">
          <h2 className="font-semibold">包含權益</h2>
          {extras.map((e) => (
            <div key={e} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{e}</span>
            </div>
          ))}
        </div>

        {/* Mock "payment" form */}
        <div className="border-t bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">付款方式（模擬）</h2>
          </div>

          <div className="rounded-lg border border-dashed bg-muted/30 p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Shield className="h-4 w-4" />
              <strong>這是 Demo / 測試環境</strong>
            </div>
            <p className="text-muted-foreground">
              實際部署時會整合 ECPay / NewebPay / Stripe 等金流。
              目前點擊「確認付款」即視為付款成功，VIP 立即開通。
            </p>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded"
            />
            <span className="text-muted-foreground">
              我同意 VIP 訂閱條款，理解此為 Demo 環境，實際正式版將整合真實金流。
            </span>
          </label>

          <Button
            onClick={pay}
            loading={processing}
            disabled={!agreed}
            size="lg"
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            確認扣點 {price} 點
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Demo 模式 — 不會實際扣款
          </p>
        </div>
      </div>
    </div>
  );
}
