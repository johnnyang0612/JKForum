/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash } from "lucide-react";

type W = any;

export function BannedWordsManager({ initial }: { initial: W[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [word, setWord] = useState("");
  const [severity, setSeverity] = useState<"BLOCK" | "FLAG">("BLOCK");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!word.trim()) return toast.error("請輸入詞");
    setBusy(true);
    try {
      const r = await fetch("/api/admin/banned-words", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.trim(), severity, category: category.trim() || null }),
      });
      const j = await r.json();
      if (j.success) {
        setList([j.banned, ...list]);
        setWord(""); setCategory("");
        toast.success("已新增");
        router.refresh();
      } else toast.error(j.error);
    } finally { setBusy(false); }
  }
  async function del(id: number) {
    if (!confirm("確定刪除？")) return;
    const r = await fetch(`/api/admin/banned-words/${id}`, { method: "DELETE" });
    const j = await r.json();
    if (j.success) { setList(list.filter(w => w.id !== id)); toast.success("已刪除"); }
    else toast.error(j.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-3">
        <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="敏感詞"
          className="flex-1 min-w-32 rounded-md border bg-background px-3 py-1.5 text-sm" />
        <select value={severity} onChange={(e) => setSeverity(e.target.value as any)}
          className="rounded-md border bg-background px-2 py-1.5 text-sm">
          <option value="BLOCK">BLOCK 攔截</option>
          <option value="FLAG">FLAG 標記</option>
        </select>
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="分類(選填)"
          className="w-32 rounded-md border bg-background px-2 py-1.5 text-sm" />
        <Button size="sm" onClick={add} disabled={busy}><Plus className="h-3 w-3" /> 新增</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[500px] text-sm">
          <thead className="bg-muted/50 text-xs">
            <tr>
              <th className="px-3 py-2 text-left">詞</th>
              <th className="px-3 py-2 text-center">嚴重度</th>
              <th className="px-3 py-2 text-left">分類</th>
              <th className="px-3 py-2 text-right">建立</th>
              <th className="px-3 py-2 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">尚無詞彙（使用內建 fallback）</td></tr>
            ) : list.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="px-3 py-2 font-mono">{w.word}</td>
                <td className="px-3 py-2 text-center text-xs">
                  <span className={`rounded px-1.5 py-0.5 ${
                    w.severity === "BLOCK" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                  }`}>{w.severity}</span>
                </td>
                <td className="px-3 py-2 text-xs">{w.category ?? "—"}</td>
                <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                  {new Date(w.createdAt).toLocaleDateString("zh-TW")}
                </td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => del(w.id)} className="text-muted-foreground hover:text-rose-400">
                    <Trash className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
