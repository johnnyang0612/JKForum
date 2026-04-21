import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils/format";
import { CheckCircle } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "任務管理" };

const CATEGORY_LABELS: Record<string, string> = {
  NEWBIE: "新手任務",
  DAILY: "日常任務",
  ACHIEVEMENT: "成就任務",
};

export default async function AdminTasksPage() {
  const tasks = await db.task.findMany({
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    include: {
      _count: { select: { progress: true } },
    },
  });

  const stats = {
    total: tasks.length,
    active: tasks.filter((t) => t.isActive).length,
    completions: tasks.reduce((s, t) => s + t._count.progress, 0),
  };

  const grouped = tasks.reduce<Record<string, typeof tasks>>((acc, t) => {
    (acc[t.type] = acc[t.type] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CheckCircle className="h-6 w-6" />
          任務管理
        </h1>
      </div>

      <div className="grid gap-4 grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">任務總數</div>
          <div className="mt-1 text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">啟用中</div>
          <div className="mt-1 text-2xl font-bold text-emerald-500">
            {stats.active}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">完成總次數</div>
          <div className="mt-1 text-2xl font-bold">
            {formatNumber(stats.completions)}
          </div>
        </div>
      </div>

      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat} className="space-y-2">
          <h2 className="text-lg font-semibold text-muted-foreground">
            {CATEGORY_LABELS[cat] || cat}
          </h2>
          <div className="overflow-hidden rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3">任務</th>
                  <th className="p-3 text-center">進度上限</th>
                  <th className="p-3 text-right">獎勵（金幣）</th>
                  <th className="p-3 text-right">獎勵（名聲）</th>
                  <th className="p-3 text-center">完成次數</th>
                  <th className="p-3 text-center">狀態</th>
                </tr>
              </thead>
              <tbody>
                {list.map((task) => (
                  <tr
                    key={task.id}
                    className="border-t transition-colors hover:bg-muted/30"
                  >
                    <td className="p-3">
                      <div className="font-medium">{task.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {task.description}
                      </div>
                    </td>
                    <td className="p-3 text-center">{task.target}</td>
                    <td className="p-3 text-right font-mono">
                      {task.rewardCoins > 0 ? `+${task.rewardCoins}` : "-"}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {task.rewardReputation > 0
                        ? `+${task.rewardReputation}`
                        : "-"}
                    </td>
                    <td className="p-3 text-center">
                      {formatNumber(task._count.progress)}
                    </td>
                    <td className="p-3 text-center">
                      {task.isActive ? (
                        <Badge variant="success">啟用</Badge>
                      ) : (
                        <Badge variant="secondary">停用</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {tasks.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          尚無任務資料
        </div>
      )}
    </div>
  );
}
