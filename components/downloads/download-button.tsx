"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Download, Ticket, Coins } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export function DownloadButton({
  resourceId,
  costCredits,
  costCoins,
  title,
}: {
  resourceId: string;
  costCredits: number;
  costCoins: number;
  title: string;
}) {
  const { data: session } = useSession();
  const { data: creditData } = useSWR(session?.user ? "/api/downloads/credits" : null, fetcher);
  const { data: pointsData } = useSWR(session?.user ? "/api/user/points" : null, fetcher);
  const [busy, setBusy] = useState<"credits" | "coins" | null>(null);

  const myCredits = creditData?.balance ?? 0;
  const myCoins = pointsData?.data?.coins ?? 0;

  const isFree = costCredits === 0 && costCoins === 0;

  if (!session?.user) {
    return (
      <Link href="/login" className="block">
        <Button className="w-full" size="lg">
          <Download className="mr-2 h-5 w-5" />
          請先登入下載
        </Button>
      </Link>
    );
  }

  async function redeem(payWith: "credits" | "coins") {
    setBusy(payWith);
    try {
      const res = await fetch(`/api/downloads/${resourceId}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payWith }),
      });
      const j = await res.json();
      if (j.success) {
        toast.success(j.redownload ? "重新下載（不重複扣費）" : `下載成功 — ${title}`);
        mutate("/api/downloads/credits");
        mutate("/api/user/points");
        // 自動觸發瀏覽器下載
        window.open(j.downloadUrl, "_blank");
      } else {
        toast.error(j.error);
      }
    } finally {
      setBusy(null);
    }
  }

  if (isFree) {
    return (
      <Button className="w-full" size="lg" onClick={() => redeem("credits")} disabled={!!busy}>
        <Download className="mr-2 h-5 w-5" />
        {busy ? "處理中..." : "免費下載"}
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <h3 className="font-bold">下載這個資源</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {costCredits > 0 && (
          <Button
            size="lg"
            disabled={busy !== null || myCredits < costCredits}
            onClick={() => redeem("credits")}
            className="gap-2"
          >
            <Ticket className="h-5 w-5 text-emerald-300" />
            {busy === "credits" ? "..." : `用 ${costCredits} 額度`}
            <span className="text-xs opacity-70">（餘 {myCredits}）</span>
          </Button>
        )}
        {costCoins > 0 && (
          <Button
            size="lg"
            variant="outline"
            disabled={busy !== null || myCoins < costCoins}
            onClick={() => redeem("coins")}
            className="gap-2"
          >
            <Coins className="h-5 w-5 text-amber-500" />
            {busy === "coins" ? "..." : `用 ${costCoins} 金幣`}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        💡 <Link href="/tasks" className="text-primary hover:underline">完成任務</Link>
        {" / "}
        <Link href="/checkin" className="text-primary hover:underline">每日簽到</Link>
        可賺取下載額度
      </p>
    </div>
  );
}
