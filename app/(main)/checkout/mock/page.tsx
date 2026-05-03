/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function MockCheckoutPage() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("orderId");
  const kind = params.get("kind") ?? "promotion";

  const [countdown, setCountdown] = useState(3);
  const [status, setStatus] = useState<"counting" | "processing" | "success" | "error">("counting");
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      setError("缺少 orderId");
      return;
    }
    if (status === "counting" && countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
    if (status === "counting" && countdown === 0) {
      setStatus("processing");
      // call callback
      (async () => {
        try {
          const res = await fetch("/api/payment/mock/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId }),
          });
          const j = await res.json();
          if (j.success) {
            setStatus("success");
            setRedirectUrl(j.redirectUrl);
            toast.success("付款成功！");
            setTimeout(() => {
              if (j.redirectUrl) router.push(j.redirectUrl);
            }, 2000);
          } else {
            setStatus("error");
            setError(j.error);
          }
        } catch (e: any) {
          setStatus("error");
          setError(e?.message ?? "callback 失敗");
        }
      })();
    }
  }, [countdown, status, orderId, router]);

  const provider = kind === "vip" ? "VIP 訂閱" : kind === "credits" ? "下載額度" : "推廣置頂";

  return (
    <div className="mx-auto max-w-md py-16">
      <div className="rounded-2xl border bg-card p-8 text-center shadow-2xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-400">
          🛠️ Demo 模式 — 跳過真實金流
        </div>

        <h1 className="text-2xl font-bold">{provider} · 付款處理中</h1>

        {status === "counting" && (
          <>
            <div className="my-8 text-7xl font-bold text-primary">
              {countdown}
            </div>
            <p className="text-sm text-muted-foreground">
              模擬金流跳轉中...自動扣款後將回到網站
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              （正式上線後會跳轉到綠界 / 藍新 / Stripe 真實付款頁）
            </p>
          </>
        )}

        {status === "processing" && (
          <>
            <Loader2 className="mx-auto my-8 h-16 w-16 animate-spin text-primary" />
            <p className="text-sm">處理付款結果中...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto my-8 h-16 w-16 text-emerald-400" />
            <h2 className="text-xl font-bold text-emerald-400">付款成功！</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              訂單已啟用 {redirectUrl ? "，正在跳轉..." : ""}
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="mx-auto my-8 h-16 w-16 text-rose-400" />
            <h2 className="text-xl font-bold text-rose-400">付款失敗</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 rounded-lg border px-4 py-2 text-sm hover:bg-muted"
            >
              返回上一頁
            </button>
          </>
        )}
      </div>
    </div>
  );
}
