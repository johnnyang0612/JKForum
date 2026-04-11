"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { awardPoints } from "@/lib/services/points-service";
import { notifyLike } from "@/lib/services/notification-service";

export async function toggleLike(targetId: string, targetType: "post" | "reply", isLike: boolean = true) {
  const user = await requireAuth();

  try {
    if (targetType === "post") {
      const existing = await db.like.findUnique({
        where: { userId_postId: { userId: user.id, postId: targetId } },
      });

      if (existing) {
        // If same type, remove. If different type, update.
        if (existing.isLike === isLike) {
          await db.like.delete({ where: { id: existing.id } });
          await db.post.update({
            where: { id: targetId },
            data: isLike ? { likeCount: { decrement: 1 } } : { dislikeCount: { decrement: 1 } },
          });
          return { success: true, action: "removed" };
        } else {
          await db.like.update({ where: { id: existing.id }, data: { isLike } });
          await db.post.update({
            where: { id: targetId },
            data: isLike
              ? { likeCount: { increment: 1 }, dislikeCount: { decrement: 1 } }
              : { likeCount: { decrement: 1 }, dislikeCount: { increment: 1 } },
          });
          return { success: true, action: "updated" };
        }
      } else {
        await db.like.create({
          data: { userId: user.id, postId: targetId, isLike },
        });
        await db.post.update({
          where: { id: targetId },
          data: isLike ? { likeCount: { increment: 1 } } : { dislikeCount: { increment: 1 } },
        });

        // Award points and notify
        if (isLike) {
          const post = await db.post.findUnique({
            where: { id: targetId },
            select: { authorId: true, title: true },
          });
          if (post && post.authorId !== user.id) {
            await awardPoints(post.authorId, "POST_LIKED", targetId);
            await notifyLike(
              post.authorId,
              user.id,
              user.name || user.username,
              post.title,
              `/posts/${targetId}`
            );
          }
        }

        return { success: true, action: "created" };
      }
    } else {
      // Reply like
      const existing = await db.like.findUnique({
        where: { userId_replyId: { userId: user.id, replyId: targetId } },
      });

      if (existing) {
        if (existing.isLike === isLike) {
          await db.like.delete({ where: { id: existing.id } });
          await db.reply.update({
            where: { id: targetId },
            data: isLike ? { likeCount: { decrement: 1 } } : { dislikeCount: { decrement: 1 } },
          });
          return { success: true, action: "removed" };
        } else {
          await db.like.update({ where: { id: existing.id }, data: { isLike } });
          await db.reply.update({
            where: { id: targetId },
            data: isLike
              ? { likeCount: { increment: 1 }, dislikeCount: { decrement: 1 } }
              : { likeCount: { decrement: 1 }, dislikeCount: { increment: 1 } },
          });
          return { success: true, action: "updated" };
        }
      } else {
        await db.like.create({
          data: { userId: user.id, replyId: targetId, isLike },
        });
        await db.reply.update({
          where: { id: targetId },
          data: isLike ? { likeCount: { increment: 1 } } : { dislikeCount: { increment: 1 } },
        });

        if (isLike) {
          const reply = await db.reply.findUnique({
            where: { id: targetId },
            select: { authorId: true, postId: true },
          });
          if (reply && reply.authorId !== user.id) {
            await awardPoints(reply.authorId, "REPLY_LIKED", targetId);
          }
        }

        return { success: true, action: "created" };
      }
    }
  } catch (error) {
    console.error("Toggle like error:", error);
    return { error: "操作失敗" };
  }
}

export async function toggleFavorite(postId: string) {
  const user = await requireAuth();

  try {
    const existing = await db.favorite.findUnique({
      where: { userId_postId: { userId: user.id, postId } },
    });

    if (existing) {
      await db.favorite.delete({ where: { id: existing.id } });
      await db.post.update({
        where: { id: postId },
        data: { favoriteCount: { decrement: 1 } },
      });
      return { success: true, favorited: false };
    } else {
      await db.favorite.create({
        data: { userId: user.id, postId },
      });
      await db.post.update({
        where: { id: postId },
        data: { favoriteCount: { increment: 1 } },
      });
      return { success: true, favorited: true };
    }
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return { error: "操作失敗" };
  }
}
