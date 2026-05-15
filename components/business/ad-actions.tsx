"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AdActions({ adId, status }: { adId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function takeDown() {
    if (!confirm("確定下架？已扣款金額不退費。")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/business/ads/${adId}/takedown`, { method: "POST" });
      const j = await res.json();
      if (j.success) { toast.success("已下架"); router.refresh(); }
      else toast.error(j.error);
    } finally { setBusy(false); }
  }

  async function relaunch() {
    setBusy(true);
    try {
      const r = await fetch(`/api/business/ads/${adId}/relaunch`, { method: "POST" });
      const j = await r.json();
      if (j.success) { toast.success("已建立草稿，請確認後送審"); router.push(`/business/ads/${j.newId}/edit`); }
      else toast.error(j.error);
    } finally { setBusy(false); }
  }

  async function clone() {
    setBusy(true);
    try {
      const r = await fetch(`/api/business/ads/${adId}/clone`, { method: "POST" });
      const j = await r.json();
      if (j.success) { toast.success("已複製"); router.push(`/business/ads/${j.newId}/edit`); }
      else toast.error(j.error);
    } finally { setBusy(false); }
  }

  async function renew() {
    if (!confirm("續期 30 天，將依目前廣告等級扣款。確定？")) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/business/ads/${adId}/renew`, { method: "POST" });
      const j = await r.json();
      if (j.success) {
        toast.success(j.charged > 0 ? `已續期，扣 ${j.charged} 點` : "已續期（FREE 不扣點）");
        router.refresh();
      } else toast.error(j.error);
    } finally { setBusy(false); }
  }

  return (
    <section className="rounded-xl border bg-card p-4">
      <h3 className="font-bold">🛠️ 操作</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {(status === "ACTIVE" || status === "EXPIRED") && (
          <Button size="sm" variant="default" onClick={renew} disabled={busy}>
            🔄 一鍵續期 30 天
          </Button>
        )}
        {status === "ACTIVE" && (
          <Button variant="destructive" size="sm" onClick={takeDown} disabled={busy}>
            主動下架
          </Button>
        )}
        {(status === "REJECTED" || status === "TAKEN_DOWN" || status === "REMOVED") && (
          <Button size="sm" onClick={relaunch} disabled={busy}>
            ⚡ 一鍵重新上架
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={clone} disabled={busy}>
          📋 複製此廣告
        </Button>
        <Button size="sm" variant="outline" onClick={() => router.push("/business/ads")}>
          回列表
        </Button>
      </div>
    </section>
  );
}
