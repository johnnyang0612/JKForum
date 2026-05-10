"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Combine } from "lucide-react";

type Tag = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  color: string | null;
  createdAt: string;
};

export function TagManager({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`刪除 ${selected.size} 個標籤？文章上的標籤關聯會被解除。`)) return;
    start(async () => {
      const r = await fetch("/api/admin/tags/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (r.ok) {
        setSelected(new Set());
        router.refresh();
      } else {
        const j = await r.json().catch(() => ({}));
        setError(j?.error ?? "刪除失敗");
      }
    });
  }

  function mergeInto() {
    if (selected.size < 2) {
      setError("合併需選 ≥ 2 個標籤");
      return;
    }
    const target = prompt("合併進哪個標籤名稱？（其他被選的會被合併進這個）", "");
    if (!target?.trim()) return;
    if (!confirm(`將其他 ${selected.size - 1} 個合併進「${target.trim()}」？`)) return;
    start(async () => {
      const r = await fetch("/api/admin/tags/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), targetName: target.trim() }),
      });
      if (r.ok) {
        setSelected(new Set());
        router.refresh();
      } else {
        const j = await r.json().catch(() => ({}));
        setError(j?.error ?? "合併失敗");
      }
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded border border-danger/50 bg-danger/10 p-2 text-sm text-danger">{error}</div>
      )}

      <div className="sticky top-14 z-10 flex flex-wrap items-center gap-2 rounded-lg border bg-card/95 backdrop-blur p-2 text-sm">
        <span>{selected.size > 0 ? `已選 ${selected.size}` : "點選標籤後可批量操作"}</span>
        <div className="ml-auto flex gap-2">
          <button onClick={mergeInto} disabled={pending || selected.size < 2}
            className="inline-flex tap-target items-center gap-1 rounded border px-3 text-xs hover:bg-muted disabled:opacity-40">
            <Combine className="h-3.5 w-3.5" /> 合併
          </button>
          <button onClick={bulkDelete} disabled={pending || selected.size === 0}
            className="inline-flex tap-target items-center gap-1 rounded border border-destructive/40 px-3 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-40">
            <Trash2 className="h-3.5 w-3.5" /> 刪除
          </button>
        </div>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2 md:grid-cols-3">
        {tags.map((t) => {
          const isSelected = selected.has(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors min-h-[44px] ${
                isSelected ? "border-primary bg-primary/10" : "hover:bg-muted"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-sm">#{t.name}</p>
                <p className="text-xs text-muted-foreground truncate">{t.slug}</p>
              </div>
              <span className="ml-2 shrink-0 text-xs text-muted-foreground">{t.postCount}</span>
            </button>
          );
        })}
        {tags.length === 0 && (
          <p className="col-span-full rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            無資料
          </p>
        )}
      </div>
    </div>
  );
}
