/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { mutate } from "swr";
import useSWR from "swr";
import { ItemIcon } from "@/components/game/item-icon";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

const RARITY_COLOR: Record<string, string> = {
  COMMON: "text-zinc-400",
  UNCOMMON: "text-emerald-400",
  RARE: "text-sky-400",
  EPIC: "text-fuchsia-400",
  LEGENDARY: "text-amber-400",
};

type Reward = {
  itemId: string;
  slug: string;
  name: string;
  iconEmoji: string | null;
  iconUrl?: string | null;
  rarity: string;
  quantity: number;
};

type Site = {
  key: string;
  label: string;
  cost: number;
  costUnit: "energy" | "hearts";
  description: string;
};

export function ActionPanel({
  endpoint,
  paramKey,
  sites,
  title,
}: {
  endpoint: string;       // /api/game/mine | /api/game/explore | /api/game/treasure
  paramKey: "location" | "treasure";
  sites: Site[];
  title: string;
}) {
  const { data: pointsData } = useSWR("/api/user/points", fetcher);
  const energy = pointsData?.data?.energy ?? 0;
  const hearts = pointsData?.data?.hearts ?? 0;

  const [busy, setBusy] = useState(false);
  const [lastRewards, setLastRewards] = useState<Reward[] | null>(null);
  const [lastSite, setLastSite] = useState<string | null>(null);

  async function trigger(site: Site) {
    setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [paramKey]: site.key }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "失敗");
      } else {
        setLastRewards(json.rewards as Reward[]);
        setLastSite(site.label);
        toast.success(`${site.label} — 獲得 ${json.rewards.length} 種道具`);
        mutate("/api/user/points");
        mutate("/api/game/inventory?tab=inventory");
      }
    } catch (e: any) {
      toast.error(e.message ?? "請求失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="rounded-lg border bg-card px-3 py-1.5">
            ⚡ 體力 <span className="font-bold">{energy}</span>
          </div>
          <div className="rounded-lg border bg-card px-3 py-1.5">
            ❤️ 愛心 <span className="font-bold">{hearts}</span>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {sites.map((s) => {
          const stock = s.costUnit === "energy" ? energy : hearts;
          const enough = stock >= s.cost;
          return (
            <div key={s.key} className="rounded-xl border bg-card p-5">
              <h3 className="text-lg font-bold">{s.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
              <p className="mt-3 text-sm">
                每次消耗 {s.costUnit === "energy" ? "⚡" : "❤️"}{" "}
                <span className="font-bold">{s.cost}</span>
              </p>
              <Button
                className="mt-3 w-full"
                disabled={busy || !enough}
                onClick={() => trigger(s)}
              >
                {busy ? "進行中..." : enough ? "出發" : "不足"}
              </Button>
            </div>
          );
        })}
      </div>

      {lastRewards && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-bold">🎁 {lastSite} — 本次戰利品</h2>
          {lastRewards.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">什麼都沒掉…再試一次！</p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {lastRewards.map((r) => (
                <li
                  key={r.slug}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <ItemIcon iconUrl={r.iconUrl} iconEmoji={r.iconEmoji} alt={r.name} size={32} />
                  <div className="flex-1">
                    <div className={`font-medium ${RARITY_COLOR[r.rarity] ?? ""}`}>
                      {r.name}
                    </div>
                    <div className="text-xs text-muted-foreground">×{r.quantity}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
