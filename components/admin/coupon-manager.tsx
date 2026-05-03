/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Power, PowerOff } from "lucide-react";

type C = any;

export function CouponManager({ initial }: { initial: C[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    code: "", type: "PERCENT", value: 10, minAmount: 0, maxUses: "",
    expiresAt: "", description: "",
  });

  async function create() {
    if (!form.code.trim() || form.value <= 0) return toast.error("code/value 必填");
    setBusy(true);
    try {
      const r = await fetch("/api/admin/coupons", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form, code: form.code.trim().toUpperCase(),
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          expiresAt: form.expiresAt || null,
        }),
      });
      const j = await r.json();
      if (j.success) {
        setList([j.coupon, ...list]);
        setOpen(false);
        toast.success("已建立");
        router.refresh();
      } else toast.error(j.error);
    } finally { setBusy(false); }
  }

  async function toggle(id: string, isActive: boolean) {
    const r = await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    const j = await r.json();
    if (j.success) { setList(list.map(c => c.id === id ? { ...c, isActive: !isActive } : c)); }
    else toast.error(j.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> 新增折扣碼</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-muted/50 text-xs">
            <tr>
              <th className="px-3 py-2 text-left">CODE</th>
              <th className="px-3 py-2 text-center">類型</th>
              <th className="px-3 py-2 text-right">值</th>
              <th className="px-3 py-2 text-right">最低</th>
              <th className="px-3 py-2 text-right">用量</th>
              <th className="px-3 py-2 text-left">到期</th>
              <th className="px-3 py-2 text-center">狀態</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-xs text-muted-foreground">無折扣碼</td></tr>
            ) : list.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2 font-mono text-xs">{c.code}</td>
                <td className="px-3 py-2 text-center text-xs">{c.type}</td>
                <td className="px-3 py-2 text-right text-xs">{c.value}{c.type === "PERCENT" ? "%" : ""}</td>
                <td className="px-3 py-2 text-right text-xs">{c.minAmount}</td>
                <td className="px-3 py-2 text-right text-xs">{c.usedCount}/{c.maxUses ?? "∞"}</td>
                <td className="px-3 py-2 text-xs">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("zh-TW") : "—"}</td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => toggle(c.id, c.isActive)}
                    className={c.isActive ? "text-emerald-400" : "text-muted-foreground"}>
                    {c.isActive ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-5 space-y-3">
            <h3 className="text-lg font-bold">新增折扣碼</h3>
            <input placeholder="CODE (英數)" value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono" />
            <select value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="PERCENT">PERCENT (% 折扣)</option>
              <option value="FIXED">FIXED (固定折抵 NT$)</option>
              <option value="BONUS">BONUS (加碼贈點 NT$)</option>
            </select>
            <input type="number" placeholder="值 (e.g. 10 = 10% 或 100 元)" value={form.value}
              onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <input type="number" placeholder="最低消費 (預設 0)" value={form.minAmount}
              onChange={(e) => setForm({ ...form, minAmount: Number(e.target.value) })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <input type="number" placeholder="總使用次數上限 (空=無限)" value={form.maxUses}
              onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <input type="datetime-local" placeholder="到期時間" value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <textarea placeholder="說明" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>取消</Button>
              <Button size="sm" onClick={create} disabled={busy}>建立</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
