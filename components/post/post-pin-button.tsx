"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pin, PinOff } from "lucide-react";
import { toast } from "sonner";

/**
 * 站長/版主在 forum 列表頁置頂或取消置頂帖子
 */
export function PostPinButton({
  postId,
  isPinned,
}: {
  postId: string;
  isPinned: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${postId}/pin`, {
        method: isPinned ? "DELETE" : "POST",
      });
      const j = await res.json();
      if (j.success) {
        toast.success(isPinned ? "已取消置頂" : "已置頂");
        startTransition(() => router.refresh());
      } else {
        toast.error(j.error ?? "操作失敗");
      }
    } catch {
      toast.error("操作失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      title={isPinned ? "取消置頂" : "置頂這篇"}
      className="inline-flex h-8 items-center gap-1 rounded-md border bg-background px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 sm:h-7 sm:px-2 sm:text-[11px]"
    >
      {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
      {isPinned ? "取消置頂" : "置頂"}
    </button>
  );
}
