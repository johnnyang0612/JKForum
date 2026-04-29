import { db } from "@/lib/db";
import { PushBroadcastForm } from "@/components/admin/push-broadcast-form";
import { Bell, Users } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "推播通知" };

export default async function AdminPushPage() {
  const [total, authed, recentSubs] = await Promise.all([
    db.pushSubscription.count(),
    db.pushSubscription.count({ where: { userId: { not: null } } }),
    db.pushSubscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        endpoint: true,
        ua: true,
        userId: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Bell className="h-7 w-7 text-primary" />
          推播通知
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          向所有訂閱者或特定用戶發送 Web Push 通知
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">總訂閱數</p>
          <p className="mt-1 text-3xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">已登入用戶</p>
          <p className="mt-1 text-3xl font-bold">{authed}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">匿名訪客</p>
          <p className="mt-1 text-3xl font-bold">{total - authed}</p>
        </div>
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 font-bold">📢 發送推播</h2>
        <PushBroadcastForm />
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <Users className="h-5 w-5" />
          最近訂閱（{recentSubs.length}）
        </h2>
        <ul className="divide-y text-sm">
          {recentSubs.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs">
                    {s.userId ? (
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400">已登入</span>
                    ) : (
                      <span className="rounded bg-zinc-500/10 px-1.5 py-0.5 text-zinc-400">匿名</span>
                    )}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {s.ua?.slice(0, 60) ?? "—"}
                  </span>
                </div>
                <code className="mt-0.5 block truncate text-[10px] opacity-50">
                  {s.endpoint.slice(0, 80)}…
                </code>
              </div>
              <span className="ml-2 text-xs text-muted-foreground">
                {new Date(s.createdAt).toLocaleString("zh-TW", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </li>
          ))}
          {recentSubs.length === 0 && (
            <li className="py-4 text-center text-xs text-muted-foreground">
              還沒有訂閱者
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
