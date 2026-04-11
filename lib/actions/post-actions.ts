"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { createPostSchema, updatePostSchema } from "@/lib/validations/post";
import { generateSlug } from "@/lib/utils/slug";
import { extractExcerpt } from "@/lib/utils/sanitize";
import { awardPoints } from "@/lib/services/points-service";

export async function createPost(formData: FormData) {
  const user = await requireAuth();

  const raw = {
    title: formData.get("title") as string,
    content: formData.get("content") as string,
    forumId: formData.get("forumId") as string,
    subforumId: (formData.get("subforumId") as string) || undefined,
    visibility: (formData.get("visibility") as string) || "PUBLIC",
    paidCoins: Number(formData.get("paidCoins") || 0),
    tags: JSON.parse((formData.get("tags") as string) || "[]"),
    status: (formData.get("status") as string) || "PUBLISHED",
  };

  const parsed = createPostSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  const slug = generateSlug(data.title);
  const excerpt = extractExcerpt(data.content, 300);

  try {
    const post = await db.post.create({
      data: {
        authorId: user.id,
        forumId: data.forumId,
        subforumId: data.subforumId || null,
        title: data.title,
        content: data.content,
        excerpt,
        slug,
        status: data.status as "DRAFT" | "PUBLISHED",
        visibility: data.visibility as "PUBLIC" | "REPLY_TO_VIEW" | "PAID" | "VIP_ONLY" | "PRIVATE",
        paidCoins: data.paidCoins,
      },
    });

    // Create tags
    if (data.tags.length > 0) {
      for (const tagName of data.tags) {
        const tag = await db.tag.upsert({
          where: { name: tagName },
          create: { name: tagName, slug: generateSlug(tagName) },
          update: { postCount: { increment: 1 } },
        });
        await db.postTag.create({
          data: { postId: post.id, tagId: tag.id },
        });
      }
    }

    // Update forum post count
    await db.forum.update({
      where: { id: data.forumId },
      data: {
        postCount: { increment: 1 },
        todayPostCount: { increment: 1 },
      },
    });

    // Update user profile post count
    await db.userProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, postCount: 1 },
      update: { postCount: { increment: 1 } },
    });

    // Award points
    if (data.status === "PUBLISHED") {
      await awardPoints(user.id, "POST_CREATED", post.id);
    }

    revalidatePath("/");
    revalidatePath("/forums");
    return { success: true, postId: post.id, slug: post.slug };
  } catch (error) {
    console.error("Create post error:", error);
    return { error: "發表文章失敗，請稍後再試" };
  }
}

export async function updatePost(formData: FormData) {
  const user = await requireAuth();

  const raw = {
    id: formData.get("id") as string,
    title: formData.get("title") as string,
    content: formData.get("content") as string,
    forumId: formData.get("forumId") as string,
    visibility: (formData.get("visibility") as string) || undefined,
    tags: JSON.parse((formData.get("tags") as string) || "[]"),
  };

  const parsed = updatePostSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  const existingPost = await db.post.findUnique({
    where: { id: data.id },
    select: { authorId: true, slug: true },
  });

  if (!existingPost) {
    return { error: "文章不存在" };
  }

  if (existingPost.authorId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return { error: "沒有編輯權限" };
  }

  try {
    const excerpt = data.content ? extractExcerpt(data.content, 300) : undefined;

    await db.post.update({
      where: { id: data.id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content, excerpt }),
        ...(data.forumId && { forumId: data.forumId }),
        ...(data.visibility && { visibility: data.visibility as "PUBLIC" | "REPLY_TO_VIEW" | "PAID" | "VIP_ONLY" | "PRIVATE" }),
      },
    });

    // Update tags if provided
    if (data.tags && data.tags.length >= 0) {
      await db.postTag.deleteMany({ where: { postId: data.id } });
      for (const tagName of data.tags) {
        const tag = await db.tag.upsert({
          where: { name: tagName },
          create: { name: tagName, slug: generateSlug(tagName) },
          update: {},
        });
        await db.postTag.create({
          data: { postId: data.id, tagId: tag.id },
        });
      }
    }

    revalidatePath(`/posts/${data.id}`);
    return { success: true, slug: existingPost.slug };
  } catch (error) {
    console.error("Update post error:", error);
    return { error: "編輯文章失敗" };
  }
}

export async function deletePost(postId: string) {
  const user = await requireAuth();

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { authorId: true, forumId: true },
  });

  if (!post) {
    return { error: "文章不存在" };
  }

  if (post.authorId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return { error: "沒有刪除權限" };
  }

  try {
    await db.post.update({
      where: { id: postId },
      data: { status: "DELETED" },
    });

    await db.forum.update({
      where: { id: post.forumId },
      data: { postCount: { decrement: 1 } },
    });

    revalidatePath("/");
    revalidatePath("/forums");
    return { success: true };
  } catch (error) {
    console.error("Delete post error:", error);
    return { error: "刪除文章失敗" };
  }
}

export async function pinPost(postId: string, pin: boolean) {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "MODERATOR") {
    return { error: "沒有權限" };
  }

  try {
    await db.post.update({
      where: { id: postId },
      data: {
        isPinned: pin,
        pinnedAt: pin ? new Date() : null,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "操作失敗" };
  }
}

export async function featurePost(postId: string, feature: boolean) {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "MODERATOR") {
    return { error: "沒有權限" };
  }

  try {
    await db.post.update({
      where: { id: postId },
      data: {
        isFeatured: feature,
        featuredAt: feature ? new Date() : null,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "操作失敗" };
  }
}

export async function lockPost(postId: string, lock: boolean) {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "MODERATOR") {
    return { error: "沒有權限" };
  }

  try {
    await db.post.update({
      where: { id: postId },
      data: { status: lock ? "LOCKED" : "PUBLISHED" },
    });

    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "操作失敗" };
  }
}
