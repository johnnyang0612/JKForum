/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import useSWR from "swr";

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
  COMMON: "text-zinc-400",
  UNCOMMON: "text-emerald-400",
  RARE: "text-sky-400",
  EPIC: "text-fuchsia-400",
  LEGENDARY: "text-amber-400",
};

export default function InventoryPage() {
  const { data } = useSWR("/api/game/inventory?tab=inventory", fetcher);
  const items = data?.items ?? [];

  const grouped = items.reduce((acc: any, x: any) => {
    (acc[x.item.category] ||= []).push(x);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">🎒 我的道具庫存</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          全部 {items.length} 種道具
        </p>
      </header>

      {Object.entries(grouped).map(([cat, list]: any) => (
        <section key={cat} className="space-y-2">
          <h2 className="text-sm font-bold text-muted-foreground">
            {CATEGORY_LABEL[cat] ?? cat}
          </h2>
          <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
            {list.map((x: any) => (
              <div
                key={x.id}
                className="flex items-center gap-2 rounded-lg border bg-card p-2"
              >
                <span className="text-2xl">{x.item.iconEmoji ?? "📦"}</span>
                <div className="flex-1 text-sm">
                  <div className={`font-medium ${RARITY_COLOR[x.item.rarity] ?? ""}`}>
                    {x.item.name}
                  </div>
                  <div className="text-xs text-muted-foreground">×{x.quantity}</div>
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
    </div>
  );
}
