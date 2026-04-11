"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TaskCard } from "./task-card";

interface TaskData {
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
}

interface TaskListProps {
  tasks: TaskData[];
}

export function TaskList({ tasks }: TaskListProps) {
  const newbieTasks = tasks.filter((t) => t.type === "NEWBIE");
  const dailyTasks = tasks.filter((t) => t.type === "DAILY");
  const achievementTasks = tasks.filter((t) => t.type === "ACHIEVEMENT");

  const dailyClaimable = dailyTasks.filter((t) => t.canClaim).length;
  const newbieClaimable = newbieTasks.filter((t) => t.canClaim).length;
  const achievementClaimable = achievementTasks.filter((t) => t.canClaim).length;

  return (
    <Tabs defaultValue="daily">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="newbie">
          新手任務
          {newbieClaimable > 0 && (
            <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {newbieClaimable}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="daily">
          日常任務
          {dailyClaimable > 0 && (
            <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {dailyClaimable}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="achievement">
          成就
          {achievementClaimable > 0 && (
            <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {achievementClaimable}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="newbie">
        <TaskGroup
          tasks={newbieTasks}
          emptyMessage="暫無新手任務"
        />
      </TabsContent>

      <TabsContent value="daily">
        <TaskGroup
          tasks={dailyTasks}
          emptyMessage="暫無日常任務"
        />
      </TabsContent>

      <TabsContent value="achievement">
        <TaskGroup
          tasks={achievementTasks}
          emptyMessage="暫無成就任務"
        />
      </TabsContent>
    </Tabs>
  );
}

function TaskGroup({ tasks, emptyMessage }: { tasks: TaskData[]; emptyMessage: string }) {
  if (tasks.length === 0) {
    return (
      <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border bg-card py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Sort: claimable first, then in-progress, then completed
  const sorted = [...tasks].sort((a, b) => {
    if (a.canClaim && !b.canClaim) return -1;
    if (!a.canClaim && b.canClaim) return 1;
    if (a.completedAt && !b.completedAt) return 1;
    if (!a.completedAt && b.completedAt) return -1;
    return 0;
  });

  return (
    <div className="mt-4 space-y-3">
      {sorted.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
