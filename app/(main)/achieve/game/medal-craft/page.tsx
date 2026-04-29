/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function MedalCraftPage() {
  const { data: rcpData } = useSWR("/api/game/inventory?tab=medal-recipes", fetcher);
  const { data: pointsData } = useSWR("/api/user/points", fetcher);
  const recipes = rcpData?.recipes ?? [];
  const coins = pointsData?.data?.coins ?? 0;
  const [busy, setBusy] = useState<string | null>(null);

  async function craft(recipeId: string) {
    setBusy(recipeId);
    try {
      const res = await fetch("/api/game/craft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, kind: "medal" }),
      });
      const json = await res.json();
      if (!json.success) toast.error(json.error);
      else {
        toast.success(`合成勳章：${json.medal.name}`);
        mutate("/api/user/points");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-end justify-between">
        <h1 className="text-2xl font-bold">🏅 勳章合成</h1>
        <div className="rounded-lg border bg-card px-3 py-1.5 text-sm">🪙 {coins}</div>
      </header>

      <div className="grid gap-3">
        {recipes.map((r: any) => (
          <div key={r.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold">→ {r.outputSlug} ×{r.outputCount}</h3>
                {r.description && (
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {(r.ingredients as any[]).map((i: any, idx: number) => (
                    <span key={idx} className="rounded border px-2 py-1">
                      🏅 {i.medalSlug} ×{i.quantity}
                    </span>
                  ))}
                  {r.costCoins > 0 && (
                    <span className="rounded border px-2 py-1">🪙 {r.costCoins}</span>
                  )}
                </div>
              </div>
              <Button
                disabled={busy === r.id || coins < r.costCoins}
                onClick={() => craft(r.id)}
              >
                {busy === r.id ? "..." : "合成"}
              </Button>
            </div>
          </div>
        ))}
        {recipes.length === 0 && (
          <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            尚無可用勳章配方
          </p>
        )}
      </div>
    </div>
  );
}
