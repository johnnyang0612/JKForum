"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Trash2 } from "lucide-react";

export function NotificationBulkActions({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);

  function markAllRead() {
    setMenuOpen(false);
    start(async () => {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
      router.refresh();
    });
  }

  function deleteRead() {
    setMenuOpen(false);
    if (!confirm("刪除所有已讀通知？此操作不可復原。")) return;
    start(async () => {
      await fetch("/api/notifications/delete-read", { method: "POST" });
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        disabled={pending}
        className="inline-flex tap-target items-center gap-1 rounded-md border px-3 text-xs hover:bg-muted disabled:opacity-50"
      >
        操作 ⌄
      </button>
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-md border bg-card shadow-lg">
            <button
              onClick={markAllRead}
              disabled={!hasUnread || pending}
              className="flex w-full items-center gap-2 rounded-t-md px-3 py-2.5 text-sm hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCheck className="h-4 w-4" />
              全部標為已讀
            </button>
            <button
              onClick={deleteRead}
              disabled={pending}
              className="flex w-full items-center gap-2 rounded-b-md px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
              刪除已讀通知
            </button>
          </div>
        </>
      )}
    </div>
  );
}
