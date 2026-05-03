/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Ban, Check, Bell } from "lucide-react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BulkUserActions({ userIds }: { userIds: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function refresh() {
      const items = document.querySelectorAll<HTMLInputElement>("[data-bulk-item]:checked");
      setSelected(Array.from(items).map((el) => el.value));
    }
    document.addEventListener("change", refresh);

    const toggleAll = document.querySelector<HTMLInputElement>("[data-bulk-toggle-all]");
    function toggleAllHandler(e: Event) {
      const checked = (e.target as HTMLInputElement).checked;
      document.querySelectorAll<HTMLInputElement>("[data-bulk-item]").forEach((el) => { el.checked = checked; });
      refresh();
    }
    toggleAll?.addEventListener("change", toggleAllHandler);
    return () => {
      document.removeEventListener("change", refresh);
      toggleAll?.removeEventListener("change", toggleAllHandler);
    };
  }, []);

  async function bulk(action: "ban" | "unban" | "notify") {
    if (selected.length === 0) return toast.error("請先勾選用戶");
    let payload: any = { userIds: selected, action };
    if (action === "notify") {
      const title = prompt("通知標題：", "📢 系統通知");
      if (!title) return;
      const content = prompt("通知內容：");
      if (!content) return;
      payload = { ...payload, title, content };
    }
    if (action === "ban" && !confirm(`確定批量封禁 ${selected.length} 位用戶？`)) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/users/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (j.success) { toast.success(`成功 ${j.count} 筆`); router.refresh(); }
      else toast.error(j.error);
    } finally { setBusy(false); }
  }

  if (selected.length === 0) return null;

  return (
    <div className="sticky top-14 z-30 flex flex-wrap items-center gap-2 rounded-xl border bg-card/95 p-3 backdrop-blur-md">
      <span className="text-sm font-medium">已選 {selected.length} 位</span>
      <div className="ml-auto flex gap-2">
        <Button size="sm" variant="outline" onClick={() => bulk("notify")} disabled={busy}>
          <Bell className="h-3 w-3" /> 批量通知
        </Button>
        <Button size="sm" variant="outline" onClick={() => bulk("unban")} disabled={busy}>
          <Check className="h-3 w-3" /> 解禁
        </Button>
        <Button size="sm" variant="destructive" onClick={() => bulk("ban")} disabled={busy}>
          <Ban className="h-3 w-3" /> 批量封禁
        </Button>
      </div>
    </div>
  );
}
