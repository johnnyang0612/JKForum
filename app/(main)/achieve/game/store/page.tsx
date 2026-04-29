/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

const RARITY_COLOR: Record<string, string> = {
  COMMON: "text-zinc-400 border-zinc-500/30",
  UNCOMMON: "text-emerald-400 border-emerald-500/30",
  RARE: "text-sky-400 border-sky-500/30",
  EPIC: "text-fuchsia-400 border-fuchsia-500/30",
  LEGENDARY: "text-amber-400 border-amber-500/30",
};

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

export default function StorePage() {
  const { data: storeData } = useSWR("/api/game/inventory?tab=store", fetcher);
  const { data: pointsData } = useSWR("/api/user/points", fetcher);
  const items = storeData?.items ?? [];
  const coins = pointsData?.data?.coins ?? 0;
  const hearts = pointsData?.data?.hearts ?? 0;
  const gems = pointsData?.data?.gems ?? 0;
  const [busy, setBusy] = useState<string | null>(null);

  const grouped = items.reduce((acc: any, it: any) => {
    (acc[it.category] ||= []).push(it);
    return acc;
  }, {});

  async function buy(slug: string) {
    setBusy(slug);
    try {
      const res = await fetch("/api/game/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, qty: 1 }),
      });
      const json = await res.json();
      if (!json.success) toast.error(json.error);
      else {
        toast.success(`購得 ${json.item.name} ×${json.qty}`);
        mutate("/api/user/points");
        mutate("/api/game/inventory?tab=inventory");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-bold">🏪 道具商店</h1>
        <div className="flex gap-3 text-sm">
          <div className="rounded-lg border bg-card px-3 py-1.5">🪙 {coins}</div>
          <div className="rounded-lg border bg-card px-3 py-1.5">❤️ {hearts}</div>
          <div className="rounded-lg border bg-card px-3 py-1.5">💎 {gems}</div>
        </div>
      </header>

      {Object.entries(grouped).map(([cat, list]: any) => (
        <section key={cat} className="space-y-3">
          <h2 className="text-lg font-bold text-muted-foreground">
            {CATEGORY_LABEL[cat] ?? cat}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
            {list.map((it: any) => {
              const price = it.priceCoins
                ? `🪙 ${it.priceCoins}`
                : it.priceHearts
                ? `❤️ ${it.priceHearts}`
                : it.priceGems
                ? `💎 ${it.priceGems}`
                : "—";
              return (
                <div
                  key={it.id}
                  className={`rounded-xl border-2 bg-card p-3 ${
                    RARITY_COLOR[it.rarity] ?? ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-3xl">{it.iconEmoji ?? "📦"}</span>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold leading-tight">{it.name}</h3>
                      <p className="mt-0.5 text-xs">{price}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    disabled={busy === it.slug}
                    onClick={() => buy(it.slug)}
                  >
                    {busy === it.slug ? "..." : "購買"}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
