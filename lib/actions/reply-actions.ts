"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { createReplySchema, updateReplySchema } from "@/lib/validations/post";
import { awardPoints } from "@/lib/services/points-service";
import { notifyReply } from "@/lib/services/notification-service";

export async function createReply(formData: FormData) {
  const user = await requireAuth();

  const raw = {
    postId: formData.get("postId") as string,
    content: formData.get("content") as string,
    parentId: (formData.get("parentId") as string) || undefined,
  };

  const parsed = createReplySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  // Check post exists and is not locked
  const post = await db.post.findUnique({
    where: { id: data.postId },
    select: { id: true, authorId: true, title: true, status: true, replyCount: true },
  });

  if (!post || post.status === "DELETED") {
    return { error: "文章不存在" };
  }

  if (post.status === "LOCKED") {
    return { error: "此文章已鎖定，無法回覆" };
  }

  // Check nesting depth if parentId provided
  if (data.parentId) {
    const parent = await db.reply.findUnique({
      where: { id: data.parentId },
      select: { parentId: true },
    });
    if (parent?.parentId) {
      // Parent already has a parent, max 2 levels
      return { error: "回覆嵌套不能超過 2 層" };
    }
  }

  try {
    const floor = post.replyCount + 1;

    const reply = await db.reply.create({
      data: {
        postId: data.postId,
        authorId: user.id,
        content: data.content,
        parentId: data.parentId || null,
        floor,
      },
    });

    // Update post reply count and last reply info
    await db.post.update({
      where: { id: data.postId },
      data: {
        replyCount: { increment: 1 },
        lastReplyAt: new Date(),
        lastReplyById: user.id,
      },
    });

    // Update user profile reply count
    await db.userProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, replyCount: 1 },
      update: { replyCount: { increment: 1 } },
    });

    // Award points
    await awardPoints(user.id, "REPLY_CREATED", reply.id);

    // Notify post author
    if (post.authorId !== user.id) {
      await notifyReply(
        post.authorId,
        user.id,
        user.name || user.username,
        post.title,
        post.id
      );
    }

    revalidatePath(`/posts/${data.postId}`);
    return { success: true, replyId: reply.id };
  } catch (error) {
    console.error("Create reply error:", error);
    return { error: "回覆失敗，請稍後再試" };
  }
}

export async function updateReply(formData: FormData) {
  const user = await requireAuth();

  const raw = {
    id: formData.get("id") as string,
    content: formData.get("content") as string,
  };

  const parsed = updateReplySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const reply = await db.reply.findUnique({
    where: { id: raw.id },
    select: { authorId: true, postId: true },
  });

  if (!reply) {
    return { error: "回覆不存在" };
  }

  if (reply.authorId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return { error: "沒有編輯權限" };
  }

  try {
    await db.reply.update({
      where: { id: raw.id },
      data: { content: raw.content },
    });

    revalidatePath(`/posts/${reply.postId}`);
    return { success: true };
  } catch {
    return { error: "編輯回覆失敗" };
  }
}

export async function deleteReply(replyId: string) {
  const user = await requireAuth();

  const reply = await db.reply.findUnique({
    where: { id: replyId },
    select: { authorId: true, postId: true },
  });

  if (!reply) {
    return { error: "回覆不存在" };
  }

  if (reply.authorId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return { error: "沒有刪除權限" };
  }

  try {
    await db.reply.update({
      where: { id: replyId },
      data: { status: "DELETED" },
    });

    await db.post.update({
      where: { id: reply.postId },
      data: { replyCount: { decrement: 1 } },
    });

    revalidatePath(`/posts/${reply.postId}`);
    return { success: true };
  } catch {
    return { error: "刪除回覆失敗" };
  }
}
