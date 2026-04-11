"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-helpers";
import {
  purchaseVip as purchaseVipService,
  cancelVip as cancelVipService,
  type VipPlanKey,
} from "@/lib/services/vip-service";

/**
 * 購買 VIP 方案
 */
export async function purchaseVipAction(planKey: VipPlanKey) {
  const user = await requireAuth();

  try {
    const result = await purchaseVipService(user.id, planKey);

    if (result.error) {
      return { error: result.error };
    }

    revalidatePath("/vip");
    revalidatePath("/profile");
    return {
      success: true,
      message: "VIP 訂閱成功！享受專屬權益吧！",
    };
  } catch (error) {
    console.error("Purchase VIP error:", error);
    return { error: "購買失敗，請稍後再試" };
  }
}

/**
 * 取消 VIP 訂閱
 */
export async function cancelVipAction(subscriptionId: string) {
  const user = await requireAuth();

  try {
    const result = await cancelVipService(subscriptionId, user.id);

    if (result.error) {
      return { error: result.error };
    }

    revalidatePath("/vip");
    revalidatePath("/profile");
    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    console.error("Cancel VIP error:", error);
    return { error: "取消失敗，請稍後再試" };
  }
}
