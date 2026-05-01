/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Coins, Send, Zap } from "lucide-react";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

const CATEGORY_LABEL: Record<string, string> = {
  TOOL: "工具",
  AURA: "靈氣",
  GEM: "寶石/原石",
  WOOD: "木材",
  CHARM: "幸運符咒",
  MATERIAL: "合成材料",
  POTION: "藥水",
  TROPHY: "戰利品",
  RARE: "稀有道具",
};

const RARITY_COLOR: Record<string, string> = {
  COMMON: "text-zinc-400 border-zinc-500/30",
  UNCOMMON: "text-emerald-400 border-emerald-500/30",
  RARE: "text-sky-400 border-sky-500/30",
  EPIC: "text-fuchsia-400 border-fuchsia-500/30",
  LEGENDARY: "text-amber-400 border-amber-500/30",
};

export default function InventoryPage() {
  const { data } = useSWR("/api/game/inventory?tab=inventory", fetcher);
  const { data: pointsData } = useSWR("/api/user/points", fetcher);
  const items = data?.items ?? [];
  const energy = pointsData?.data?.energy ?? 0;
  const hearts = pointsData?.data?.hearts ?? 0;
  const coins = pointsData?.data?.coins ?? 0;

  const [busy, setBusy] = useState<string | null>(null);
  const [giftFor, setGiftFor] = useState<{ slug: string; name: string } | null>(null);
  const [giftTo, setGiftTo] = useState("");
  const [exchangeAmount, setExchangeAmount] = useState(10);

  const grouped = items.reduce((acc: any, x: any) => {
    (acc[x.item.category] ||= []).push(x);
    return acc;
  }, {});

  async function sell(slug: string, qty: number) {
    setBusy(slug);
    try {
      const res = await fetch("/api/game/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, qty }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`賣出 ${json.item.name} ×${json.sold}，獲得 🪙 ${json.coinsEarned}`);
        mutate("/api/game/inventory?tab=inventory");
        mutate("/api/user/points");
      } else toast.error(json.error);
    } finally {
      setBusy(null);
    }
  }

  async function gift() {
    if (!giftFor || !giftTo.trim()) return;
    setBusy(giftFor.slug);
    try {
      const res = await fetch("/api/game/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: giftFor.slug, toUsername: giftTo.trim(), qty: 1 }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`已贈送 ${json.item.name} 給 @${json.toUser.username}`);
        setGiftFor(null);
        setGiftTo("");
        mutate("/api/game/inventory?tab=inventory");
      } else toast.error(json.error);
    } finally {
      setBusy(null);
    }
  }

  async function exchangeEnergy() {
    setBusy("__exchange__");
    try {
      const res = await fetch("/api/game/exchange-energy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: exchangeAmount }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`兌換 ⚡ +${json.energyGained}（消耗 ❤️ ${json.heartsSpent}）`);
        mutate("/api/user/points");
      } else toast.error(json.error);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">🎒 我的道具庫存</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            全部 {items.length} 種道具 — 可賣出回收金幣或贈送好友
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="rounded-lg border bg-card px-3 py-1.5">🪙 {coins}</span>
          <span className="rounded-lg border bg-card px-3 py-1.5">⚡ {energy}</span>
          <span className="rounded-lg border bg-card px-3 py-1.5">❤️ {hearts}</span>
        </div>
      </header>

      {/* 愛心換體力 */}
      <section className="rounded-xl border bg-gradient-to-br from-rose-500/10 to-amber-500/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-bold">
              <Zap className="h-5 w-5 text-amber-500" />
              愛心換體力
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              10 ❤️ = 1 ⚡ · 一般上限 100 / VIP 上限 200
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={100}
              value={exchangeAmount}
              onChange={(e) => setExchangeAmount(Number(e.target.value))}
              className="w-20 rounded-lg border bg-background px-2 py-1.5 text-sm"
            />
            <Button
              size="sm"
              onClick={exchangeEnergy}
              disabled={busy === "__exchange__" || hearts < exchangeAmount * 10}
            >
              兌換
            </Button>
          </div>
        </div>
      </section>

      {/* 道具列表 */}
      {Object.entries(grouped).map(([cat, list]: any) => (
        <section key={cat} className="space-y-2">
          <h2 className="text-sm font-bold text-muted-foreground">
            {CATEGORY_LABEL[cat] ?? cat}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {list.map((x: any) => (
              <div
                key={x.id}
                className={`rounded-lg border-2 bg-card p-3 ${RARITY_COLOR[x.item.rarity] ?? ""}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-3xl">{x.item.iconEmoji ?? "📦"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold">{x.item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      庫存 ×{x.quantity}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex gap-1">
                  <button
                    type="button"
                    disabled={busy === x.item.slug}
                    onClick={() => sell(x.item.slug, 1)}
                    className="flex-1 rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-400 transition hover:bg-amber-500/30 disabled:opacity-50"
                  >
                    <Coins className="mr-1 inline h-3 w-3" />
                    賣 1 個
                  </button>
                  {x.quantity >= 5 && (
                    <button
                      type="button"
                      disabled={busy === x.item.slug}
                      onClick={() => sell(x.item.slug, 5)}
                      className="flex-1 rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-400 transition hover:bg-amber-500/30 disabled:opacity-50"
                    >
                      賣 5 個
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy === x.item.slug}
                    onClick={() => setGiftFor({ slug: x.item.slug, name: x.item.name })}
                    className="flex-none rounded bg-fuchsia-500/20 px-2 py-1 text-xs text-fuchsia-400 transition hover:bg-fuchsia-500/30 disabled:opacity-50"
                    title="贈送給好友"
                  >
                    <Send className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {items.length === 0 && (
        <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          背包還空空的，去挖礦或開寶箱看看吧！
        </p>
      )}

      {/* 贈送 modal */}
      {giftFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setGiftFor(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold">贈送 {giftFor.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">輸入收件人 username</p>
            <input
              type="text"
              value={giftTo}
              onChange={(e) => setGiftTo(e.target.value)}
              placeholder="例：linda_chen"
              className="mt-3 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setGiftFor(null)}>
                取消
              </Button>
              <Button
                className="flex-1"
                disabled={!giftTo.trim() || busy === giftFor.slug}
                onClick={gift}
              >
                送出
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
