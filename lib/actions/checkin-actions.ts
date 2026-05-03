"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

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

    // Award base checkin points via new engine
    const { earnPointsSafe } = await import("@/lib/points-engine");
    await earnPointsSafe({
      userId: user.id,
      action: "checkin",
      relatedId: checkin.id,
      note: `連續簽到 ${streak} 天`,
    });

    // Streak bonuses — manual ledger entry (no rule needed)
    let bonusCoins = 0;
    if (streak === 3) bonusCoins = 50;
    else if (streak === 7) bonusCoins = 100;
    else if (streak % 30 === 0) bonusCoins = 300;
    if (bonusCoins > 0) {
      await db.userPoints.update({
        where: { userId: user.id },
        data: {
          coins: { increment: bonusCoins },
          totalPoints: { increment: bonusCoins },
        },
      });
      await db.pointLedger.create({
        data: {
          userId: user.id,
          action: `checkin_streak_${streak}`,
          delta: { coins: bonusCoins } as object,
          relatedId: checkin.id,
          note: `連續 ${streak} 天獎勵`,
        },
      });
      coinsEarned += bonusCoins;
    }

    // 連續簽到里程碑發 voucher
    let voucherGranted: string | null = null;
    try {
      const { maybeGrantCheckinVoucher } = await import("@/lib/voucher-rewards");
      const results = await maybeGrantCheckinVoucher(user.id, streak, checkin.id);
      const granted = results.filter((r) => r?.granted);
      if (granted.length > 0) {
        voucherGranted = `額外獲得 ${granted.length} 張置頂卡 🎟️`;
      }
    } catch (e) {
      console.warn("Voucher grant failed:", e);
    }

    // 簽到送下載額度
    let creditsGranted = 0;
    try {
      const { addCredits } = await import("@/lib/download-engine");
      let amount = 1;
      if (streak === 7) amount = 5;
      else if (streak === 30) amount = 20;
      else if (streak === 100) amount = 50;
      await addCredits({
        userId: user.id,
        amount,
        reason: "EARN_CHECKIN",
        relatedId: checkin.id,
        note: `連續簽到 ${streak} 天獲得 ${amount} 下載額度`,
      });
      creditsGranted = amount;
    } catch (e) {
      console.warn("Credit grant failed:", e);
    }

    revalidatePath("/checkin");
    return {
      success: true,
      streak,
      coinsEarned,
      voucherGranted,
      creditsGranted,
      message: `簽到成功！連續 ${streak} 天，+${coinsEarned} 金幣${creditsGranted > 0 ? ` +${creditsGranted} 下載額度 🎟️` : ""}${voucherGranted ? ` ${voucherGranted}` : ""}`,
    };
  } catch (error) {
    console.error("Checkin error:", error);
    return { error: "簽到失敗，請稍後再試" };
  }
}
