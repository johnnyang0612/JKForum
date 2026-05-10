"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePost } from "@/lib/actions/post-actions";

/**
 * 作者自己看到的編輯/刪除小工具列。
 * 顯示在 /my-posts 與 /posts/[postId]（owner 視角）。
 */
export function PostAuthorActions({
  postId,
  size = "sm",
}: {
  postId: string;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("確定刪除這篇文章？此動作無法復原。")) return;
    setBusy(true);
    try {
      const r = await deletePost(postId);
      if (r?.error) {
        toast.error(r.error);
      } else {
        toast.success("已刪除");
        startTransition(() => router.refresh());
      }
    } finally {
      setBusy(false);
    }
  }

  const cls =
    size === "sm"
      ? "inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2 text-xs"
      : "inline-flex h-8 items-center gap-1 rounded-md border bg-background px-2.5 text-sm";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link
        href={`/posts/${postId}/edit`}
        onClick={(e) => e.stopPropagation()}
        className={cls + " text-muted-foreground hover:bg-muted hover:text-foreground"}
      >
        <Pencil className="h-3.5 w-3.5" />
        編輯
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className={cls + " text-destructive hover:bg-destructive/10 disabled:opacity-50"}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {busy ? "刪除中..." : "刪除"}
      </button>
    </div>
  );
}
