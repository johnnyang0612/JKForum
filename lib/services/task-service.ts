import { db } from "@/lib/db";
import { TaskType, PointType, PointChangeReason, Prisma } from "@prisma/client";

/**
 * 取得任務列表（含用戶進度）
 */
export async function getTasks(userId: string, type?: TaskType) {
  const tasks = await db.task.findMany({
    where: {
      isActive: true,
      ...(type ? { type } : {}),
    },
    include: {
      progress: {
        where: { userId },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return tasks.map((task) => {
    const userProgress = task.progress[0];
    return {
      id: task.id,
      name: task.name,
      description: task.description,
      type: task.type,
      target: task.target,
      rewardCoins: task.rewardCoins,
      rewardReputation: task.rewardReputation,
      rewardGems: task.rewardGems,
      badgeId: task.badgeId,
      iconUrl: task.iconUrl,
      progress: userProgress?.progress ?? 0,
      completed: userProgress?.completed ?? false,
      completedAt: userProgress?.completedAt ?? null,
      canClaim: (userProgress?.completed ?? false) && !userProgress?.completedAt,
    };
  });
}

/**
 * 取得用戶的任務統計
 */
export async function getTaskStats(userId: string) {
  const [totalTasks, completedTasks, dailyCompleted] = await Promise.all([
    db.task.count({ where: { isActive: true } }),
    db.userTaskProgress.count({
      where: { userId, completed: true },
    }),
    db.userTaskProgress.count({
      where: {
        userId,
        completed: true,
        task: { type: TaskType.DAILY },
        updatedAt: {
          gte: getToday(),
        },
      },
    }),
  ]);

  return {
    totalTasks,
    completedTasks,
    dailyCompleted,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  };
}

/**
 * 更新任務進度
 * 當用戶執行動作時呼叫（發文、回覆、按讚、簽到等）
 */
export async function updateProgress(
  userId: string,
  action: "post" | "reply" | "like" | "checkin" | "profile" | "streak"
) {
  // 找出受影響的任務
  const actionTaskMap: Record<string, string[]> = {
    post: ["task_newbie_first_post", "task_daily_post", "task_achievement_100_posts"],
    reply: ["task_newbie_first_reply", "task_daily_reply"],
    like: ["task_achievement_500_likes"],
    checkin: ["task_daily_checkin"],
    profile: ["task_newbie_profile"],
    streak: ["task_achievement_30_streak"],
  };

  const taskIds = actionTaskMap[action] || [];
  if (taskIds.length === 0) return;

  // 取得相關任務
  const tasks = await db.task.findMany({
    where: {
      id: { in: taskIds },
      isActive: true,
    },
  });

  for (const task of tasks) {
    // 取得或建立用戶進度
    const existingProgress = await db.userTaskProgress.findUnique({
      where: {
        userId_taskId: { userId, taskId: task.id },
      },
    });

    // 如果已完成且不是日常任務，跳過
    if (existingProgress?.completed && task.type !== TaskType.DAILY) {
      continue;
    }

    const currentProgress = existingProgress?.progress ?? 0;
    const newProgress = Math.min(currentProgress + 1, task.target);
    const isCompleted = newProgress >= task.target;

    await db.userTaskProgress.upsert({
      where: {
        userId_taskId: { userId, taskId: task.id },
      },
      create: {
        userId,
        taskId: task.id,
        progress: newProgress,
        completed: isCompleted,
      },
      update: {
        progress: newProgress,
        completed: isCompleted,
      },
    });
  }
}

/**
 * 領取任務獎勵
 */
export async function claimReward(userId: string, taskId: string) {
  const progress = await db.userTaskProgress.findUnique({
    where: {
      userId_taskId: { userId, taskId },
    },
    include: { task: true },
  });

  if (!progress) {
    return { error: "找不到該任務進度" };
  }

  if (!progress.completed) {
    return { error: "任務尚未完成" };
  }

  if (progress.completedAt) {
    return { error: "獎勵已經領取過了" };
  }

  const task = progress.task;

  // 執行交易：標記領取 + 發放獎勵
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const operations: Prisma.PrismaPromise<any>[] = [];

  // 標記已領取
  operations.push(
    db.userTaskProgress.update({
      where: { id: progress.id },
      data: { completedAt: new Date() },
    })
  );

  // 發放金幣
  if (task.rewardCoins > 0) {
    operations.push(
      db.pointHistory.create({
        data: {
          userId,
          type: PointType.COINS,
          amount: task.rewardCoins,
          reason: PointChangeReason.ACHIEVEMENT_UNLOCK,
          detail: `完成任務「${task.name}」獲得金幣`,
          relatedId: taskId,
        },
      })
    );
  }

  // 發放名聲
  if (task.rewardReputation > 0) {
    operations.push(
      db.pointHistory.create({
        data: {
          userId,
          type: PointType.REPUTATION,
          amount: task.rewardReputation,
          reason: PointChangeReason.ACHIEVEMENT_UNLOCK,
          detail: `完成任務「${task.name}」獲得名聲`,
          relatedId: taskId,
        },
      })
    );
  }

  // 更新用戶積分
  const coinsDelta = task.rewardCoins;
  const repDelta = task.rewardReputation;

  if (coinsDelta > 0 || repDelta > 0) {
    operations.push(
      db.userPoints.upsert({
        where: { userId },
        create: {
          userId,
          coins: coinsDelta,
          reputation: repDelta,
          totalPoints: coinsDelta + repDelta,
          level: 16,
        },
        update: {
          coins: { increment: coinsDelta },
          reputation: { increment: repDelta },
          totalPoints: { increment: coinsDelta + repDelta },
        },
      })
    );
  }

  // 發送通知
  operations.push(
    db.notification.create({
      data: {
        recipientId: userId,
        type: "ACHIEVEMENT",
        title: `任務完成：${task.name}`,
        content: `恭喜完成任務！獲得 ${task.rewardCoins} 金幣、${task.rewardReputation} 名聲`,
        linkUrl: "/tasks",
      },
    })
  );

  await db.$transaction(operations);

  return {
    success: true,
    rewards: {
      coins: task.rewardCoins,
      reputation: task.rewardReputation,
      gems: task.rewardGems,
      badgeId: task.badgeId,
    },
  };
}

/**
 * 重置每日任務（由排程呼叫）
 */
export async function resetDailyTasks() {
  const dailyTasks = await db.task.findMany({
    where: { type: TaskType.DAILY, isActive: true },
  });

  const dailyTaskIds = dailyTasks.map((t) => t.id);

  // 重置所有用戶的每日任務進度
  const result = await db.userTaskProgress.updateMany({
    where: {
      taskId: { in: dailyTaskIds },
    },
    data: {
      progress: 0,
      completed: false,
      completedAt: null,
    },
  });

  return { resetCount: result.count };
}

/**
 * 輔助：取得今天零時
 */
function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}
