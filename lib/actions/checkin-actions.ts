"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { awardPoints } from "@/lib/services/points-service";

export async function performCheckin() {
  const user = await requireAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already checked in today
  const existing = await db.checkin.findUnique({
    where: {
      userId_date: { userId: user.id, date: today },
    },
  });

  if (existing) {
    return { error: "今天已經簽到過了", alreadyCheckedIn: true };
  }

  try {
    // Get yesterday's checkin for streak calculation
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayCheckin = await db.checkin.findUnique({
      where: {
        userId_date: { userId: user.id, date: yesterday },
      },
    });

    const streak = yesterdayCheckin ? yesterdayCheckin.streak + 1 : 1;

    // Base reward is 30 coins
    let coinsEarned = 30;

    // Create checkin record
    const checkin = await db.checkin.create({
      data: {
        userId: user.id,
        date: today,
        streak,
        coinsEarned,
      },
    });

    // Award base points
    await awardPoints(user.id, "DAILY_CHECKIN", checkin.id);

    // Streak bonuses
    if (streak === 3) {
      await awardPoints(user.id, "CHECKIN_STREAK_3", checkin.id);
      coinsEarned += 50;
    } else if (streak === 7) {
      await awardPoints(user.id, "CHECKIN_STREAK_7", checkin.id);
      coinsEarned += 100;
    } else if (streak % 30 === 0) {
      await awardPoints(user.id, "CHECKIN_STREAK_30", checkin.id);
      coinsEarned += 300;
    }

    revalidatePath("/checkin");
    return {
      success: true,
      streak,
      coinsEarned,
      message: `簽到成功！連續簽到 ${streak} 天，獲得 ${coinsEarned} 金幣`,
    };
  } catch (error) {
    console.error("Checkin error:", error);
    return { error: "簽到失敗，請稍後再試" };
  }
}
