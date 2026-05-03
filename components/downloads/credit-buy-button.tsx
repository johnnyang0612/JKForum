"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { toast } from "sonner";

export function CreditBuyButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [credits, setCredits] = useState(10);
  const [busy, setBusy] = useState(false);

  async function buy() {
    setBusy(true);
    try {
      const res = await fetch("/api/downloads/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits }),
      });
      const j = await res.json();
      if (j.success) {
        toast.success(`兌換成功！+${j.gained} 額度，餘額 ${j.balance}`);
        setOpen(false);
        router.refresh();
      } else toast.error(j.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1">
        <Coins className="h-4 w-4 text-amber-500" />
        金幣換額度
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-xl border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold">金幣兌換下載額度</h3>
            <p className="mt-1 text-xs text-muted-foreground">100 金幣 = 1 下載額度</p>
            <div className="mt-4 flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={1000}
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
              />
              <span className="text-sm text-muted-foreground">額度</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              將消耗 <b className="text-amber-500">{credits * 100}</b> 金幣
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button className="flex-1" onClick={buy} disabled={busy || credits < 1}>
                {busy ? "..." : "確認兌換"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
