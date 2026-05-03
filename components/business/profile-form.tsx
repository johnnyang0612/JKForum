"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BadgeCheck } from "lucide-react";

export function BusinessProfileForm({
  initial, verified,
}: {
  initial: { merchantName: string; merchantBio: string };
  verified: boolean;
}) {
  const router = useRouter();
  const [merchantName, setMerchantName] = useState(initial.merchantName);
  const [merchantBio, setMerchantBio] = useState(initial.merchantBio);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!merchantName.trim()) return toast.error("商號必填");
    setBusy(true);
    try {
      const res = await fetch("/api/business/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantName: merchantName.trim(),
          merchantBio: merchantBio.trim(),
        }),
      });
      const j = await res.json();
      if (j.success) {
        toast.success("已儲存");
        router.refresh();
      } else toast.error(j.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">基本資訊</h3>
        {verified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
            <BadgeCheck className="h-3 w-3" /> 業者已認證
          </span>
        ) : (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
            未認證
          </span>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">商號 / 店名 *</label>
        <input
          value={merchantName}
          onChange={(e) => setMerchantName(e.target.value)}
          maxLength={60}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">簡介</label>
        <textarea
          value={merchantBio}
          onChange={(e) => setMerchantBio(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="店家簡介、服務理念..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">{merchantBio.length}/500</p>
      </div>

      <Button onClick={save} disabled={busy}>
        {busy ? "儲存中..." : "儲存變更"}
      </Button>
    </div>
  );
}
