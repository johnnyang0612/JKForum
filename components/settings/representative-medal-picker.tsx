/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

type Medal = { slug: string; name: string; iconEmoji: string | null; tier: string };

export function RepresentativeMedalPicker() {
  const router = useRouter();
  const { data, isLoading } = useSWR<{ medals: Medal[]; current: string | null }>("/api/profile/representative-medal", fetcher);
  const [busy, setBusy] = useState(false);

  if (isLoading) return <p className="text-sm text-muted-foreground">載入勳章中...</p>;
  if (!data || data.medals.length === 0) return (
    <p className="text-sm text-muted-foreground">
      你目前還沒有勳章。發文、簽到、完成任務可獲得勳章。
    </p>
  );

  async function set(slug: string | null) {
    setBusy(true);
    try {
      const res = await fetch("/api/profile/representative-medal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const j = await res.json();
      if (j.success) {
        toast.success(slug ? "代表勳章已設定" : "已清除代表勳章");
        mutate("/api/profile/representative-medal");
        router.refresh();
      } else toast.error(j.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        從你持有的勳章選 1 個，會顯示在你的頭像旁
      </p>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
        {/* 清除選項 */}
        <button
          type="button"
          disabled={busy || !data.current}
          onClick={() => set(null)}
          className={`flex aspect-square items-center justify-center rounded-lg border bg-muted/30 text-xs transition hover:bg-muted ${
            !data.current ? "border-primary text-primary" : ""
          }`}
        >
          無
        </button>
        {data.medals.map((m) => {
          const active = data.current === m.slug;
          return (
            <button
              key={m.slug}
              type="button"
              disabled={busy}
              onClick={() => set(m.slug)}
              title={m.name}
              className={`flex aspect-square items-center justify-center rounded-lg border bg-muted/30 text-2xl transition hover:scale-110 ${
                active ? "border-primary ring-2 ring-primary" : ""
              }`}
            >
              {m.iconEmoji ?? "🏅"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
