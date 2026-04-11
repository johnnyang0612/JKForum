"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { notifyFollow } from "@/lib/services/notification-service";

export async function toggleFollow(targetUserId: string) {
  const user = await requireAuth();

  if (user.id === targetUserId) {
    return { error: "不能追蹤自己" };
  }

  try {
    const existing = await db.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUserId,
        },
      },
    });

    if (existing) {
      await db.userFollow.delete({ where: { id: existing.id } });

      // Update counts
      await Promise.all([
        db.userProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, followingCount: 0 },
          update: { followingCount: { decrement: 1 } },
        }),
        db.userProfile.upsert({
          where: { userId: targetUserId },
          create: { userId: targetUserId, followerCount: 0 },
          update: { followerCount: { decrement: 1 } },
        }),
      ]);

      revalidatePath(`/profile/${targetUserId}`);
      return { success: true, following: false };
    } else {
      await db.userFollow.create({
        data: {
          followerId: user.id,
          followingId: targetUserId,
        },
      });

      // Update counts
      await Promise.all([
        db.userProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, followingCount: 1 },
          update: { followingCount: { increment: 1 } },
        }),
        db.userProfile.upsert({
          where: { userId: targetUserId },
          create: { userId: targetUserId, followerCount: 1 },
          update: { followerCount: { increment: 1 } },
        }),
      ]);

      // Notify
      await notifyFollow(targetUserId, user.id, user.name || user.username);

      revalidatePath(`/profile/${targetUserId}`);
      return { success: true, following: true };
    }
  } catch (error) {
    console.error("Toggle follow error:", error);
    return { error: "操作失敗" };
  }
}
