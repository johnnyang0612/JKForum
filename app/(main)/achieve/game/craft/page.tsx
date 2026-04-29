/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function CraftPage() {
  const { data: rcpData } = useSWR("/api/game/inventory?tab=recipes", fetcher);
  const { data: invData } = useSWR("/api/game/inventory?tab=inventory", fetcher);
  const { data: pointsData } = useSWR("/api/user/points", fetcher);
  const recipes = rcpData?.recipes ?? [];
  const inv = invData?.items ?? [];
  const coins = pointsData?.data?.coins ?? 0;
  const energy = pointsData?.data?.energy ?? 0;
  const [busy, setBusy] = useState<string | null>(null);

  const stockOf = (itemId: string) =>
    inv.find((x: any) => x.itemId === itemId)?.quantity ?? 0;

  async function craft(recipeId: string) {
    setBusy(recipeId);
    try {
      const res = await fetch("/api/game/craft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, kind: "item" }),
      });
      const json = await res.json();
      if (!json.success) toast.error(json.error);
      else {
        toast.success(`合成 ${json.output.name} ×${json.count}`);
        mutate("/api/user/points");
        mutate("/api/game/inventory?tab=inventory");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-bold">🧪 道具合成</h1>
        <div className="flex gap-3 text-sm">
          <div className="rounded-lg border bg-card px-3 py-1.5">🪙 {coins}</div>
          <div className="rounded-lg border bg-card px-3 py-1.5">⚡ {energy}</div>
        </div>
      </header>

      <div className="grid gap-3">
        {recipes.map((r: any) => {
          const enough =
            r.ingredients.every((i: any) => stockOf(i.itemId) >= i.quantity) &&
            coins >= r.costCoins &&
            energy >= r.costEnergy;
          return (
            <div key={r.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{r.output.iconEmoji ?? "📦"}</span>
                    <div>
                      <h3 className="font-bold">
                        {r.output.name} ×{r.outputCount}
                      </h3>
                      {r.description && (
                        <p className="text-xs text-muted-foreground">{r.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {r.ingredients.map((i: any) => {
                      const have = stockOf(i.itemId);
                      const ok = have >= i.quantity;
                      return (
                        <span
                          key={i.id}
                          className={`rounded border px-2 py-1 ${
                            ok ? "border-emerald-500/40" : "border-rose-500/40 text-rose-400"
                          }`}
                        >
                          {i.item.iconEmoji ?? "📦"} {i.item.name} {have}/{i.quantity}
                        </span>
                      );
                    })}
                    {r.costCoins > 0 && (
                      <span
                        className={`rounded border px-2 py-1 ${
                          coins >= r.costCoins ? "border-emerald-500/40" : "border-rose-500/40 text-rose-400"
                        }`}
                      >
                        🪙 {r.costCoins}
                      </span>
                    )}
                    {r.costEnergy > 0 && (
                      <span
                        className={`rounded border px-2 py-1 ${
                          energy >= r.costEnergy ? "border-emerald-500/40" : "border-rose-500/40 text-rose-400"
                        }`}
                      >
                        ⚡ {r.costEnergy}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  disabled={!enough || busy === r.id}
                  onClick={() => craft(r.id)}
                >
                  {busy === r.id ? "..." : "合成"}
                </Button>
              </div>
            </div>
          );
        })}
        {recipes.length === 0 && (
          <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            尚無可用配方
          </p>
        )}
      </div>
    </div>
  );
}
