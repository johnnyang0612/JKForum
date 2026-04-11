"use client";

import { useState, useTransition } from "react";
import { Gift, Coins, Star, Gem, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { claimTaskRewardAction } from "@/lib/actions/task-actions";

interface TaskCardProps {
  task: {
    id: string;
    name: string;
    description: string;
    type: string;
    target: number;
    rewardCoins: number;
    rewardReputation: number;
    rewardGems: number;
    progress: number;
    completed: boolean;
    completedAt: string | null;
    canClaim: boolean;
  };
}

export function TaskCard({ task }: TaskCardProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null);
  const [claimed, setClaimed] = useState(!!task.completedAt);

  const progressPercent = Math.min(100, Math.round((task.progress / task.target) * 100));

  function handleClaim() {
    setResult(null);
    startTransition(async () => {
      const res = await claimTaskRewardAction(task.id);
      setResult(res);
      if (res.success) {
        setClaimed(true);
      }
    });
  }

  return (
    <Card className={claimed ? "opacity-70" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            claimed
              ? "bg-success/10 text-success"
              : task.completed
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}>
            {claimed ? (
              <Check className="h-5 w-5" />
            ) : task.type === "NEWBIE" ? (
              "🌱"
            ) : task.type === "DAILY" ? (
              "📋"
            ) : (
              "🏆"
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{task.name}</h4>
              {claimed && <Badge variant="success">已完成</Badge>}
              {task.canClaim && !claimed && <Badge variant="default">可領取</Badge>}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{task.description}</p>

            {/* Progress bar */}
            <div className="mt-2">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  進度 {task.progress}/{task.target}
                </span>
                <span className={task.completed ? "font-medium text-success" : "text-muted-foreground"}>
                  {progressPercent}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    task.completed ? "bg-success" : "bg-primary"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Rewards */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {task.rewardCoins > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-yellow-600">
                  <Coins className="h-3 w-3" />
                  {task.rewardCoins} 金幣
                </span>
              )}
              {task.rewardReputation > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-blue-600">
                  <Star className="h-3 w-3" />
                  {task.rewardReputation} 名聲
                </span>
              )}
              {task.rewardGems > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-purple-600">
                  <Gem className="h-3 w-3" />
                  {task.rewardGems} 寶石
                </span>
              )}
            </div>

            {/* Result message */}
            {result?.error && (
              <p className="mt-1 text-xs text-danger">{result.error}</p>
            )}
            {result?.success && (
              <p className="mt-1 text-xs text-success">{result.message}</p>
            )}
          </div>

          {/* Claim button */}
          {task.canClaim && !claimed && (
            <Button
              size="sm"
              onClick={handleClaim}
              disabled={isPending}
              className="shrink-0"
            >
              <Gift className="mr-1 h-3.5 w-3.5" />
              {isPending ? "領取中..." : "領取"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
