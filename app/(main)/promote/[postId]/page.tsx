/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Megaphone, ArrowLeft, Coins, Ticket } from "lucide-react";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function PromotePage() {
  const params = useParams();
  const router = useRouter();
  const postId = String((params as any).postId);
  const { data } = useSWR("/api/promotions", fetcher);
  const { data: pointsData } = useSWR("/api/user/points", fetcher);
  const coins = pointsData?.data?.coins ?? 0;
  const [busy, setBusy] = useState<string | null>(null);

  const configs = data?.configs ?? [];
  const vouchers = data?.vouchers ?? [];

  async function buy(type: string) {
    setBusy(type);
    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, type }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`購買成功！置頂至 ${new Date(json.endAt).toLocaleString("zh-TW")}`);
        mutate("/api/user/points");
        setTimeout(() => router.push(`/posts/${postId}`), 1500);
      } else toast.error(json.error);
    } finally {
      setBusy(null);
    }
  }

  async function payByMethod(type: string, method: "ECPAY" | "NEWEBPAY" | "STRIPE") {
    setBusy(type);
    try {
      const res = await fetch("/api/payment/promotion/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, type, method }),
      });
      const j = await res.json();
      if (j.success) {
        router.push(j.checkoutUrl);
      } else toast.error(j.error);
    } finally {
      setBusy(null);
    }
  }

  async function redeemVoucher(voucherId: string) {
    setBusy(voucherId);
    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, voucherId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("置頂卡使用成功！");
        mutate("/api/promotions");
        setTimeout(() => router.push(`/posts/${postId}`), 1500);
      } else toast.error(json.error);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href={`/posts/${postId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" />
        返回文章
      </Link>

      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Megaphone className="h-7 w-7 text-primary" />
          推廣置頂這篇文章
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          選擇置頂方案讓更多人看到。可用金幣支付或使用置頂卡。
        </p>
        <div className="mt-2 inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm">
          <Coins className="h-4 w-4 text-amber-500" />
          目前持有：<b>{coins.toLocaleString()}</b> 金幣
        </div>
      </header>

      {/* 置頂卡（vouchers）*/}
      {vouchers.length > 0 && (
        <section className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4">
          <h2 className="flex items-center gap-2 font-bold">
            <Ticket className="h-5 w-5 text-emerald-400" />
            你持有的置頂卡（{vouchers.length}）
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            從任務 / 簽到 / VIP 月卡 / 推廣拉新獲得，可直接使用免付費
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {vouchers.map((v: any) => {
              const cfg = configs.find((c: any) => c.type === v.type);
              return (
                <div key={v.id} className="rounded-lg border bg-card p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold">{cfg?.emoji} {cfg?.label}</div>
                      <div className="text-xs text-muted-foreground">來源：{v.source}</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => redeemVoucher(v.id)}
                      disabled={busy === v.id}
                    >
                      {busy === v.id ? "..." : "使用"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 商品 */}
      <section>
        <h2 className="mb-3 font-bold">📋 置頂方案</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {configs.map((c: any) => {
            const enough = coins >= c.priceCoins;
            return (
              <div
                key={c.type}
                className="rounded-xl border bg-card p-4 transition hover:border-primary/40"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{c.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-bold">{c.label}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-sm mb-2">
                    <div className="text-amber-500">🪙 {c.priceCoins.toLocaleString()} 金幣</div>
                    <div className="text-xs text-muted-foreground">或 NT$ {c.priceTwd.toLocaleString()} 真金</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={busy === c.type || !enough}
                      onClick={() => buy(c.type)}
                    >
                      {busy === c.type ? "..." : enough ? "🪙 金幣" : "金幣不足"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => payByMethod(c.type, "ECPAY")}
                      className="rounded bg-emerald-500/20 px-2 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/30"
                      title="綠界 ECPay"
                    >
                      綠界
                    </button>
                    <button
                      type="button"
                      onClick={() => payByMethod(c.type, "NEWEBPAY")}
                      className="rounded bg-blue-500/20 px-2 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-500/30"
                      title="藍新金流"
                    >
                      藍新
                    </button>
                    <button
                      type="button"
                      onClick={() => payByMethod(c.type, "STRIPE")}
                      className="rounded bg-violet-500/20 px-2 py-1.5 text-xs font-bold text-violet-400 hover:bg-violet-500/30"
                      title="Stripe"
                    >
                      Stripe
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p>📌 <b>付費方案</b>：目前僅支援金幣支付，真實金流（綠界/藍新）即將上線。</p>
        <p className="mt-1">🎁 <b>免費獲得置頂卡</b>：連續簽到 30 天 / 完成達人任務 / 推廣 5 個新會員 / 訂閱 VIP。</p>
      </section>
    </div>
  );
}
