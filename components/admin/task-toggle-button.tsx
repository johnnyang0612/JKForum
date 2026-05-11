"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export function TaskToggleButton({ taskId, isActive }: { taskId: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const r = await fetch(`/api/admin/tasks/${taskId}/toggle`, { method: "POST" });
      if (r.ok) router.refresh();
      else alert("切換失敗");
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="inline-flex items-center gap-1 disabled:opacity-50"
      title={isActive ? "點擊停用" : "點擊啟用"}
    >
      {isActive ? <Badge variant="success">啟用</Badge> : <Badge variant="secondary">停用</Badge>}
    </button>
  );
}
