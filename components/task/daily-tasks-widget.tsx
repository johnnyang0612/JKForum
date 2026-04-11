"use client";

import { useTransition, useState } from "react";
import { ClipboardList, Gift, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { claimTaskRewardAction } from "@/lib/actions/task-actions";
import Link from "next/link";

interface DailyTask {
  id: string;
  name: string;
  target: number;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  canClaim: boolean;
  rewardCoins: number;
}

interface DailyTasksWidgetProps {
  tasks: DailyTask[];
}

export function DailyTasksWidget({ tasks }: DailyTasksWidgetProps) {
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4" />
            今日任務
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>
        {/* Overall progress */}
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pt-0">
        {tasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            暫無日常任務
          </p>
        ) : (
          tasks.map((task) => (
            <DailyTaskRow key={task.id} task={task} />
          ))
        )}

        <Link
          href="/tasks"
          className="mt-2 block text-center text-sm text-primary hover:underline"
        >
          查看所有任務
        </Link>
      </CardContent>
    </Card>
  );
}

function DailyTaskRow({ task }: { task: DailyTask }) {
  const [isPending, startTransition] = useTransition();
  const [claimed, setClaimed] = useState(!!task.completedAt);

  const progressPercent = Math.min(100, Math.round((task.progress / task.target) * 100));

  function handleClaim() {
    startTransition(async () => {
      const res = await claimTaskRewardAction(task.id);
      if (res.success) {
        setClaimed(true);
      }
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-2.5">
      {/* Status icon */}
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
        claimed
          ? "bg-success/10 text-success"
          : task.canClaim
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground"
      }`}>
        {claimed ? (
          <Check className="h-4 w-4" />
        ) : (
          <span className="text-xs font-bold">{task.progress}/{task.target}</span>
        )}
      </div>

      {/* Task info */}
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${claimed ? "text-muted-foreground line-through" : "font-medium"}`}>
          {task.name}
        </p>
        {!claimed && (
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Reward / Claim */}
      {task.canClaim && !claimed ? (
        <Button
          size="sm"
          variant="outline"
          onClick={handleClaim}
          disabled={isPending}
          className="h-7 px-2 text-xs"
        >
          <Gift className="mr-0.5 h-3 w-3" />
          {isPending ? "..." : "領取"}
        </Button>
      ) : !claimed ? (
        <span className="text-xs text-muted-foreground">+{task.rewardCoins}</span>
      ) : (
        <span className="text-xs text-success">已領取</span>
      )}
    </div>
  );
}
