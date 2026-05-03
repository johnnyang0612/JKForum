/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { db } from "@/lib/db";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "下載資源管理" };

export default async function AdminDownloadsPage() {
  const [items, total, totalDownloads, creditsAgg] = await Promise.all([
    db.downloadResource.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.downloadResource.count(),
    db.downloadHistory.count(),
    db.downloadCredit.aggregate({ _sum: { totalEarned: true, totalSpent: true, balance: true } }),
  ]);

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Download className="h-7 w-7 text-primary" />
            下載資源管理
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            上架資源 / 設定價格 / 查看下載統計
          </p>
        </div>
        <Link href="/admin/downloads/new">
          <Button>
            <Plus className="mr-1 h-4 w-4" />
            新增資源
          </Button>
        </Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">資源總數</p>
          <p className="mt-1 text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">總下載次數</p>
          <p className="mt-1 text-2xl font-bold">{totalDownloads}</p>
        </div>
        <div className="rounded-xl border bg-emerald-500/10 p-4">
          <p className="text-xs text-muted-foreground">流通中下載額度</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {(creditsAgg._sum.balance ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border bg-rose-500/10 p-4">
          <p className="text-xs text-muted-foreground">已消耗額度</p>
          <p className="mt-1 text-2xl font-bold text-rose-400">
            {(creditsAgg._sum.totalSpent ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-muted/50 text-xs">
            <tr>
              <th className="px-3 py-2 text-left">標題</th>
              <th className="px-3 py-2 text-left">分類</th>
              <th className="px-3 py-2 text-right">大小</th>
              <th className="px-3 py-2 text-right">額度/金幣</th>
              <th className="px-3 py-2 text-right">下載數</th>
              <th className="px-3 py-2 text-center">狀態</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  暫無資源，<Link href="/admin/downloads/new" className="text-primary">新增第一個</Link>
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 max-w-[300px] truncate">
                    <Link href={`/downloads/${it.id}`} target="_blank" className="hover:text-primary">
                      {it.isFeatured && "⭐ "}
                      {it.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs">{it.category}</td>
                  <td className="px-3 py-2 text-right text-xs">
                    {it.fileSize >= 1024 ** 2
                      ? `${(it.fileSize / 1024 ** 2).toFixed(1)} MB`
                      : `${(it.fileSize / 1024).toFixed(1)} KB`}
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    🎟️{it.costCredits} / 🪙{it.costCoins}
                  </td>
                  <td className="px-3 py-2 text-right">{it.downloadCount}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      it.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-400"
                    }`}>
                      {it.isActive ? "上架" : "下架"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
