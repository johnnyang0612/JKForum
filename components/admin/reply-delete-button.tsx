"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function ReplyDeleteButton({ replyId }: { replyId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function handle() {
    const reason = prompt("刪除原因（必填）：");
    if (!reason) return;
    start(async () => {
      const r = await fetch(`/api/admin/replies/${replyId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (r.ok) router.refresh();
      else alert("刪除失敗");
    });
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      className="rounded p-1 text-destructive hover:bg-destructive/10 disabled:opacity-50"
      title="刪除"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
