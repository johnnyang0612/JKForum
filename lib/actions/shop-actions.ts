"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-helpers";
import {
  purchaseItem as purchaseItemService,
  useItem as useItemService,
} from "@/lib/services/shop-service";

/**
 * 購買商城道具
 */
export async function purchaseItemAction(itemId: string) {
  const user = await requireAuth();

  try {
    const result = await purchaseItemService(user.id, itemId);

    if (result.error) {
      return { error: result.error };
    }

    revalidatePath("/shop");
    revalidatePath("/profile");
    return {
      success: true,
      message: "購買成功！道具已加入你的背包。",
    };
  } catch (error) {
    console.error("Purchase item error:", error);
    return { error: "購買失敗，請稍後再試" };
  }
}

/**
 * 使用道具
 */
export async function useItemAction(userItemId: string, targetId?: string) {
  const user = await requireAuth();

  try {
    const result = await useItemService(user.id, userItemId, targetId);

    if (result.error) {
      return { error: result.error };
    }

    revalidatePath("/shop");
    revalidatePath("/profile");
    if (targetId) {
      revalidatePath(`/posts/${targetId}`);
    }

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    console.error("Use item error:", error);
    return { error: "使用道具失敗，請稍後再試" };
  }
}
