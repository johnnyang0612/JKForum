/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash, Save, EyeOff, Eye } from "lucide-react";

type Tag = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  sortOrder: number;
  isActive: boolean;
  isUnlimited: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export function BusinessTagsManager({ initial }: { initial: Tag[] }) {
  const router = useRouter();
  const [list, setList] = useState<Tag[]>(initial);

  // 新增表單
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [sortOrder, setSortOrder] = useState<number | "">(0);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [busy, setBusy] = useState(false);

  // 編輯中的 id (inline 編輯)
  const [editing, setEditing] = useState<Record<string, Partial<Tag>>>({});

  const grouped = useMemo(() => {
    const g: Record<string, Tag[]> = {};
    const unlim: Tag[] = [];
    for (const t of list) {
      if (t.isUnlimited) unlim.push(t);
      else (g[t.category ?? "（無分類）"] ||= []).push(t);
    }
    const entries: Array<[string, Tag[]]> = [];
    if (unlim.length) entries.push(["不限", unlim]);
    entries.push(...Object.entries(g));
    return entries;
  }, [list]);

  async function add() {
    if (!name.trim()) return toast.error("請輸入標籤名稱");
    setBusy(true);
    try {
      const r = await fetch("/api/admin/business-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim() || null,
          sortOrder: sortOrder === "" ? 0 : Number(sortOrder),
          isUnlimited,
        }),
      });
      const j = await r.json();
      if (j.success) {
        setList([...list, j.tag]);
        setName(""); setCategory(""); setSortOrder(0); setIsUnlimited(false);
        toast.success("已新增");
        router.refresh();
      } else toast.error(j.error);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(t: Tag) {
    setEditing((s) => ({ ...s, [t.id]: { name: t.name, category: t.category, sortOrder: t.sortOrder } }));
  }
  function cancelEdit(id: string) {
    setEditing((s) => {
      const n = { ...s };
      delete n[id];
      return n;
    });
  }
  async function saveEdit(t: Tag) {
    const patch = editing[t.id];
    if (!patch) return;
    const r = await fetch(`/api/admin/business-tags/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const j = await r.json();
    if (j.success) {
      setList(list.map((x) => (x.id === t.id ? j.tag : x)));
      cancelEdit(t.id);
      toast.success("已儲存");
    } else toast.error(j.error);
  }

  async function toggleActive(t: Tag) {
    const r = await fetch(`/api/admin/business-tags/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    const j = await r.json();
    if (j.success) {
      setList(list.map((x) => (x.id === t.id ? j.tag : x)));
      toast.success(j.tag.isActive ? "已啟用" : "已停用");
    } else toast.error(j.error);
  }

  async function del(t: Tag, hard: boolean) {
    if (!confirm(hard ? `確定永久刪除「${t.name}」？此操作無法還原` : `停用「${t.name}」？`)) return;
    const r = await fetch(`/api/admin/business-tags/${t.id}${hard ? "?hard=1" : ""}`, {
      method: "DELETE",
    });
    const j = await r.json();
    if (j.success) {
      if (hard) setList(list.filter((x) => x.id !== t.id));
      else setList(list.map((x) => (x.id === t.id ? { ...x, isActive: false } : x)));
      toast.success(hard ? "已刪除" : "已停用");
    } else toast.error(j.error);
  }

  return (
    <div className="space-y-4">
      {/* 新增區塊 */}
      <div className="rounded-xl border bg-card p-3">
        <div className="mb-2 text-xs font-medium text-muted-foreground">新增標籤</div>
        <div className="grid gap-2 sm:grid-cols-[2fr_1.5fr_80px_auto_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="標籤名稱（必填，最多 40 字）"
            maxLength={40}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="分類（選填，例：服務 / 口部 / 特殊）"
            maxLength={40}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          />
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="排序"
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          />
          <label className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <input type="checkbox" checked={isUnlimited} onChange={(e) => setIsUnlimited(e.target.checked)} />
            不限
          </label>
          <Button size="sm" onClick={add} disabled={busy}>
            <Plus className="h-3 w-3" /> 新增
          </Button>
        </div>
      </div>

      {/* 列表 - 依 category 分組 */}
      {grouped.map(([cat, items]) => (
        <section key={cat} className="rounded-xl border bg-card">
          <div className="border-b bg-muted/30 px-3 py-1.5 text-xs font-bold">
            {cat}（{items.length}）
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-muted/50 text-xs">
                <tr>
                  <th className="w-12 px-3 py-2 text-center">排序</th>
                  <th className="px-3 py-2 text-left">名稱</th>
                  <th className="px-3 py-2 text-left">分類</th>
                  <th className="px-3 py-2 text-left">slug</th>
                  <th className="px-3 py-2 text-center">狀態</th>
                  <th className="px-3 py-2 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => {
                  const e = editing[t.id];
                  const isEditing = !!e;
                  return (
                    <tr key={t.id} className="border-t">
                      <td className="px-3 py-2 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={(e.sortOrder as number) ?? t.sortOrder}
                            onChange={(ev) =>
                              setEditing((s) => ({
                                ...s,
                                [t.id]: { ...s[t.id], sortOrder: Number(ev.target.value) },
                              }))
                            }
                            className="w-16 rounded border bg-background px-1 py-0.5 text-xs"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">{t.sortOrder}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <input
                            value={(e.name as string) ?? t.name}
                            maxLength={40}
                            onChange={(ev) =>
                              setEditing((s) => ({
                                ...s,
                                [t.id]: { ...s[t.id], name: ev.target.value },
                              }))
                            }
                            className="w-full rounded border bg-background px-2 py-1 text-sm"
                          />
                        ) : (
                          <span className={t.isUnlimited ? "font-bold text-primary" : ""}>
                            {t.name}
                            {t.isUnlimited && <span className="ml-1 text-[10px] text-primary">★</span>}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {isEditing ? (
                          <input
                            value={(e.category as string) ?? (t.category ?? "")}
                            maxLength={40}
                            onChange={(ev) =>
                              setEditing((s) => ({
                                ...s,
                                [t.id]: { ...s[t.id], category: ev.target.value || null },
                              }))
                            }
                            className="w-32 rounded border bg-background px-2 py-1 text-xs"
                          />
                        ) : (
                          t.category ?? "—"
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{t.slug}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => toggleActive(t)}
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] ${
                            t.isActive
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-muted text-muted-foreground"
                          }`}
                          title="切換啟用 / 停用"
                        >
                          {t.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {t.isActive ? "啟用" : "停用"}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="inline-flex gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(t)}
                                className="text-emerald-500 hover:opacity-70"
                                title="儲存"
                              >
                                <Save className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => cancelEdit(t.id)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                取消
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(t)}
                                className="text-xs text-muted-foreground hover:text-primary"
                              >
                                編輯
                              </button>
                              <button
                                onClick={() => del(t, true)}
                                className="text-muted-foreground hover:text-rose-400"
                                title="永久刪除"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {list.length === 0 && (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          尚無標籤；可執行 <code className="rounded bg-muted px-1">npm run seed:business-tags</code>{" "}
          匯入預設清單
        </div>
      )}
    </div>
  );
}
