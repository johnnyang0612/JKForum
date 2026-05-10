"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

type Block = {
  blockedId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
};

export function BlockedUsersList({ initial }: { initial: Block[] }) {
  const [list, setList] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  function unblock(b: Block) {
    if (!confirm(`解除封鎖 ${b.displayName}？`)) return;
    setError("");
    start(async () => {
      const r = await fetch(`/api/users/${b.blockedId}/block`, { method: "DELETE" });
      if (r.ok) {
        setList((l) => l.filter((x) => x.blockedId !== b.blockedId));
      } else {
        const j = await r.json().catch(() => ({}));
        setError(j?.error ?? "解除失敗");
      }
    });
  }

  if (list.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        尚未封鎖任何使用者
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && <div className="rounded border border-danger/40 bg-danger/10 p-2 text-sm text-danger">{error}</div>}
      {list.map((b) => (
        <div key={b.blockedId} className="flex items-center gap-3 rounded-md border bg-card p-3">
          {b.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-muted" />
          )}
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${b.blockedId}`} className="font-medium hover:underline">
              {b.displayName}
            </Link>
            <p className="text-xs text-muted-foreground">@{b.username}</p>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            封鎖於 {new Date(b.createdAt).toLocaleDateString("zh-TW")}
          </p>
          <button
            type="button"
            onClick={() => unblock(b)}
            disabled={pending}
            className="rounded border border-destructive/50 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50 min-h-[40px]"
          >
            解除封鎖
          </button>
        </div>
      ))}
    </div>
  );
}
