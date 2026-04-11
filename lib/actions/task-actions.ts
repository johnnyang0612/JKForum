"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-helpers";
import { claimReward } from "@/lib/services/task-service";

/**
 * 領取任務獎勵
 */
export async function claimTaskRewardAction(taskId: string) {
  const user = await requireAuth();

  try {
    const result = await claimReward(user.id, taskId);

    if (result.error) {
      return { error: result.error };
    }

    revalidatePath("/tasks");
    revalidatePath("/profile");

    const rewards = result.rewards!;
    const rewardParts: string[] = [];
    if (rewards.coins > 0) rewardParts.push(`${rewards.coins} 金幣`);
    if (rewards.reputation > 0) rewardParts.push(`${rewards.reputation} 名聲`);
    if (rewards.gems > 0) rewardParts.push(`${rewards.gems} 寶石`);

    return {
      success: true,
      message: `獎勵領取成功！獲得 ${rewardParts.join("、")}`,
      rewards,
    };
  } catch (error) {
    console.error("Claim task reward error:", error);
    return { error: "領取獎勵失敗，請稍後再試" };
  }
}
