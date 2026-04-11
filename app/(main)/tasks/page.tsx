"use client";

import { Trophy, Coins, Star, Target, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TaskList } from "@/components/task/task-list";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TasksPage() {
  const { data: tasksData, isLoading } = useSWR("/api/tasks", fetcher);
  const { data: statsData } = useSWR("/api/tasks/stats", fetcher);

  const tasks = tasksData?.data?.tasks || [];
  const stats = statsData?.data || {
    totalTasks: 0,
    completedTasks: 0,
    dailyCompleted: 0,
    completionRate: 0,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Trophy className="h-7 w-7 text-primary" />
          任務中心
        </h1>
        <p className="mt-1 text-muted-foreground">
          完成任務獲取豐厚獎勵，提升你的等級和影響力！
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <Target className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">任務完成</p>
              <p className="text-lg font-bold">
                {stats.completedTasks}/{stats.totalTasks}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <Star className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">完成率</p>
              <p className="text-lg font-bold">{stats.completionRate}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">今日日常</p>
              <p className="text-lg font-bold">{stats.dailyCompleted}/3</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
              <Coins className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">累計獲得</p>
              <p className="text-lg font-bold">--</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">載入任務中...</p>
        </div>
      ) : (
        <TaskList tasks={tasks} />
      )}
    </div>
  );
}
