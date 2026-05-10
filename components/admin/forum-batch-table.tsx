"use client";

import Link from "next/link";
import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, LockOpen } from "lucide-react";
import { toggleForumVisibility, toggleForumLocked } from "@/lib/actions/admin-actions";

type Forum = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  todayPostCount: number;
  isVisible: boolean;
  isLocked: boolean;
  categoryName: string;
};

type Category = {
  id: string;
  name: string;
  forums: Forum[];
};

export function ForumBatchTable({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allForums = useMemo(() => categories.flatMap((c) => c.forums), [categories]);
  const allIds = useMemo(() => allForums.map((f) => f.id), [allForums]);

  const allSelected = selected.size > 0 && selected.size === allIds.length;
  const partiallySelected = selected.size > 0 && !allSelected;

  function toggleSelect(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleSelectAll() {
    setSelected((s) => (s.size === allIds.length ? new Set() : new Set(allIds)));
  }

  function toggleSelectCategory(cat: Category) {
    const ids = cat.forums.map((f) => f.id);
    setSelected((s) => {
      const all = ids.every((id) => s.has(id));
      const n = new Set(s);
      if (all) ids.forEach((id) => n.delete(id));
      else ids.forEach((id) => n.add(id));
      return n;
    });
  }

  function bulkSetVisibility(target: boolean) {
    if (selected.size === 0) return;
    if (!confirm(`確定將 ${selected.size} 個看板批量設為「${target ? "顯示" : "隱藏"}」？`)) return;
    start(async () => {
      // 用 Promise.all 並發；若數量大可改 chunk
      await fetch("/api/admin/forums/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), isVisible: target }),
      });
      setSelected(new Set());
      router.refresh();
    });
  }

  function bulkSetLocked(target: boolean) {
    if (selected.size === 0) return;
    if (!confirm(`確定將 ${selected.size} 個看板批量設為「${target ? "鎖定" : "解鎖"}」？`)) return;
    start(async () => {
      await fetch("/api/admin/forums/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), isLocked: target }),
      });
      setSelected(new Set());
      router.refresh();
    });
  }

  function quickToggleV(id: string) {
    start(async () => {
      await toggleForumVisibility(id);
      router.refresh();
    });
  }

  function quickToggleL(id: string) {
    start(async () => {
      await toggleForumLocked(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* 批量工具列 */}
      <div className="sticky top-header z-10 flex flex-wrap items-center gap-2 rounded-lg border bg-card/95 backdrop-blur p-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => { if (el) el.indeterminate = partiallySelected; }}
            onChange={toggleSelectAll}
          />
          <span>{selected.size > 0 ? `已選 ${selected.size} 個` : "全選"}</span>
        </label>
        <div className="ml-auto flex flex-wrap gap-2">
          <button onClick={() => bulkSetVisibility(true)} disabled={pending || selected.size === 0}
            className="rounded border border-success/50 px-3 py-1 text-xs text-success hover:bg-success/10 disabled:opacity-40">
            批量顯示
          </button>
          <button onClick={() => bulkSetVisibility(false)} disabled={pending || selected.size === 0}
            className="rounded border border-warning/50 px-3 py-1 text-xs text-warning hover:bg-warning/10 disabled:opacity-40">
            批量隱藏
          </button>
          <button onClick={() => bulkSetLocked(false)} disabled={pending || selected.size === 0}
            className="rounded border px-3 py-1 text-xs hover:bg-muted disabled:opacity-40">
            批量解鎖
          </button>
          <button onClick={() => bulkSetLocked(true)} disabled={pending || selected.size === 0}
            className="rounded border border-destructive/50 px-3 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-40">
            批量鎖定
          </button>
        </div>
      </div>

      {categories.map((cat) => {
        const catSelectedCount = cat.forums.filter((f) => selected.has(f.id)).length;
        const catAllSelected = catSelectedCount > 0 && catSelectedCount === cat.forums.length;
        return (
          <div key={cat.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={catAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = catSelectedCount > 0 && !catAllSelected;
                }}
                onChange={() => toggleSelectCategory(cat)}
              />
              <h2 className="text-lg font-semibold">{cat.name}</h2>
              <span className="text-xs text-muted-foreground">({cat.forums.length} 板)</span>
            </div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 w-8"></th>
                    <th className="p-2 text-left">看板名稱</th>
                    <th className="p-2 text-left">代稱</th>
                    <th className="p-2 text-left">文章數</th>
                    <th className="p-2 text-left">今日</th>
                    <th className="p-2 text-left">狀態（點擊切換）</th>
                    <th className="p-2 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.forums.map((forum) => (
                    <tr key={forum.id} className={`border-b hover:bg-muted/20 ${selected.has(forum.id) ? "bg-primary/5" : ""}`}>
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selected.has(forum.id)}
                          onChange={() => toggleSelect(forum.id)}
                        />
                      </td>
                      <td className="p-2 font-medium">{forum.name}</td>
                      <td className="p-2 text-muted-foreground font-mono text-xs">{forum.slug}</td>
                      <td className="p-2">{forum.postCount.toLocaleString()}</td>
                      <td className="p-2 text-success">+{forum.todayPostCount}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => quickToggleV(forum.id)}
                            disabled={pending}
                            title={forum.isVisible ? "點擊隱藏" : "點擊顯示"}
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                              forum.isVisible
                                ? "border-success/40 bg-success/10 text-success hover:bg-success/20"
                                : "border-muted-foreground/40 bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {forum.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            {forum.isVisible ? "顯示" : "隱藏"}
                          </button>
                          <button
                            type="button"
                            onClick={() => quickToggleL(forum.id)}
                            disabled={pending}
                            title={forum.isLocked ? "點擊解鎖" : "點擊鎖定"}
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                              forum.isLocked
                                ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
                                : "border-muted text-muted-foreground hover:bg-muted/60"
                            }`}
                          >
                            {forum.isLocked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
                            {forum.isLocked ? "鎖定" : "未鎖"}
                          </button>
                        </div>
                      </td>
                      <td className="p-2">
                        <Link href={`/admin/forums/${forum.id}`}
                          className="text-primary hover:underline text-xs">編輯</Link>
                      </td>
                    </tr>
                  ))}
                  {cat.forums.length === 0 && (
                    <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">此分類下暫無看板</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {cat.forums.map((forum) => (
                <div
                  key={forum.id}
                  className={`rounded-lg border bg-card p-3 ${selected.has(forum.id) ? "border-primary/50 bg-primary/5" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(forum.id)}
                      onChange={() => toggleSelect(forum.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{forum.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{forum.slug}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {forum.postCount.toLocaleString()} 篇 · 今日 <span className="text-success">+{forum.todayPostCount}</span>
                      </p>
                    </div>
                    <Link
                      href={`/admin/forums/${forum.id}`}
                      className="tap-target flex items-center justify-center rounded border px-3 text-xs text-primary hover:bg-primary/5"
                    >
                      編輯
                    </Link>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => quickToggleV(forum.id)}
                      disabled={pending}
                      className={`flex-1 inline-flex tap-target items-center justify-center gap-1 rounded-md border text-sm transition-colors disabled:opacity-50 ${
                        forum.isVisible
                          ? "border-success/40 bg-success/10 text-success"
                          : "border-muted-foreground/40 bg-muted text-muted-foreground"
                      }`}
                    >
                      {forum.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      {forum.isVisible ? "顯示中" : "已隱藏"}
                    </button>
                    <button
                      type="button"
                      onClick={() => quickToggleL(forum.id)}
                      disabled={pending}
                      className={`flex-1 inline-flex tap-target items-center justify-center gap-1 rounded-md border text-sm transition-colors disabled:opacity-50 ${
                        forum.isLocked
                          ? "border-destructive/40 bg-destructive/10 text-destructive"
                          : "border-muted text-muted-foreground"
                      }`}
                    >
                      {forum.isLocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
                      {forum.isLocked ? "已鎖定" : "未鎖"}
                    </button>
                  </div>
                </div>
              ))}
              {cat.forums.length === 0 && (
                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  此分類下暫無看板
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
