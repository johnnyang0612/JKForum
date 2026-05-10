"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Save, Plus } from "lucide-react";

type Cat = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconEmoji: string | null;
  rating: string;
  isVisible: boolean;
  isEnabled: boolean;
  sortOrder: number;
  forumCount: number;
};

export function CategoryManager({ initial }: { initial: Cat[] }) {
  const router = useRouter();
  const [list, setList] = useState<Cat[]>(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);

  function update(id: string, patch: Partial<Cat>) {
    setList((l) => l.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function save(c: Cat) {
    setError("");
    start(async () => {
      const r = await fetch(`/api/admin/categories/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
      const j = await r.json();
      if (!r.ok) setError(j?.error ?? "儲存失敗");
      else router.refresh();
    });
  }

  function del(c: Cat) {
    if (c.forumCount > 0) {
      alert(`此分類下還有 ${c.forumCount} 個看板，請先移走或刪除`);
      return;
    }
    if (!confirm(`確定刪除「${c.name}」？`)) return;
    start(async () => {
      const r = await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" });
      if (r.ok) {
        setList((l) => l.filter((x) => x.id !== c.id));
        router.refresh();
      } else {
        const j = await r.json();
        setError(j?.error ?? "刪除失敗");
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger">{error}</div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-2 w-16">排序</th>
              <th className="p-2 w-12">圖示</th>
              <th className="p-2">名稱</th>
              <th className="p-2">代稱</th>
              <th className="p-2 w-20">分級</th>
              <th className="p-2 w-16">顯示</th>
              <th className="p-2 w-16">啟用</th>
              <th className="p-2 w-20">看板數</th>
              <th className="p-2 w-32">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-b hover:bg-muted/20">
                <td className="p-2">
                  <input
                    type="number"
                    value={c.sortOrder}
                    onChange={(e) => update(c.id, { sortOrder: Number(e.target.value) })}
                    className="w-14 rounded border bg-background px-2 py-1 text-xs"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={c.iconEmoji ?? ""}
                    onChange={(e) => update(c.id, { iconEmoji: e.target.value })}
                    className="w-10 rounded border bg-background px-1 py-1 text-center text-base"
                    maxLength={4}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => update(c.id, { name: e.target.value })}
                    className="w-full rounded border bg-background px-2 py-1"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={c.slug}
                    onChange={(e) => update(c.id, { slug: e.target.value })}
                    className="w-full rounded border bg-background px-2 py-1 font-mono text-xs"
                  />
                </td>
                <td className="p-2">
                  <select
                    value={c.rating}
                    onChange={(e) => update(c.id, { rating: e.target.value })}
                    className="rounded border bg-background px-2 py-1 text-xs"
                  >
                    <option value="G">G</option>
                    <option value="PG13">PG13</option>
                    <option value="R18">R18</option>
                  </select>
                </td>
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={c.isVisible}
                    onChange={(e) => update(c.id, { isVisible: e.target.checked })}
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={c.isEnabled}
                    onChange={(e) => update(c.id, { isEnabled: e.target.checked })}
                  />
                </td>
                <td className="p-2 text-muted-foreground">{c.forumCount}</td>
                <td className="p-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => save(c)}
                      disabled={pending}
                      className="rounded bg-primary p-1 text-primary-foreground hover:opacity-80 disabled:opacity-50"
                      title="儲存"
                    >
                      <Save className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => del(c)}
                      disabled={pending}
                      className="rounded bg-destructive p-1 text-destructive-foreground hover:opacity-80 disabled:opacity-50"
                      title="刪除"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        {!showNew ? (
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1 rounded-md border border-dashed px-3 py-2 text-sm hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> 新增分類
          </button>
        ) : (
          <NewCategoryForm
            onCancel={() => setShowNew(false)}
            onCreated={(c) => {
              setList((l) => [...l, c]);
              setShowNew(false);
              router.refresh();
            }}
          />
        )}
      </div>
    </div>
  );
}

function NewCategoryForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (c: Cat) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [rating, setRating] = useState("G");
  const [icon, setIcon] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  function submit() {
    setError("");
    if (!name.trim() || !slug.trim()) {
      setError("名稱與代稱為必填");
      return;
    }
    start(async () => {
      const r = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, rating, iconEmoji: icon }),
      });
      const j = await r.json();
      if (!r.ok) setError(j?.error ?? "建立失敗");
      else onCreated(j.data);
    });
  }

  return (
    <div className="space-y-2 rounded-md border bg-card p-3">
      {error && <div className="text-sm text-danger">{error}</div>}
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs">圖示</label>
          <input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4}
            className="w-12 rounded border bg-background px-1 py-1 text-center" placeholder="🎯" />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="mb-1 block text-xs">名稱</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded border bg-background px-2 py-1" />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="mb-1 block text-xs">代稱 (slug)</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded border bg-background px-2 py-1 font-mono text-xs" />
        </div>
        <div>
          <label className="mb-1 block text-xs">分級</label>
          <select value={rating} onChange={(e) => setRating(e.target.value)}
            className="rounded border bg-background px-2 py-1 text-xs">
            <option value="G">G</option>
            <option value="PG13">PG13</option>
            <option value="R18">R18</option>
          </select>
        </div>
        <button type="button" onClick={submit} disabled={pending}
          className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-80 disabled:opacity-50">
          建立
        </button>
        <button type="button" onClick={onCancel}
          className="rounded border px-3 py-1.5 text-sm hover:bg-muted">取消</button>
      </div>
    </div>
  );
}
