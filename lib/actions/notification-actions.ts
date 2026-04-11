"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

export async function markNotificationAsRead(notificationId: string) {
  const user = await requireAuth();

  try {
    await db.notification.updateMany({
      where: {
        id: notificationId,
        recipientId: user.id,
      },
      data: { isRead: true },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch {
    return { error: "操作失敗" };
  }
}

export async function markAllNotificationsAsRead() {
  const user = await requireAuth();

  try {
    await db.notification.updateMany({
      where: {
        recipientId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch {
    return { error: "操作失敗" };
  }
}
