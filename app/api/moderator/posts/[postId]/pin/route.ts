import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function checkAccess(userId: string, role: string, forumId: string) {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return true;
  const m = await db.forumModerator.findUnique({
    where: { forumId_userId: { forumId, userId } },
  });
  return !!m;
}

export async function POST(req: Request, { params }: { params: { postId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.redirect(new URL("/login", req.url));

  const post = await db.post.findUnique({
    where: { id: params.postId },
    select: { forumId: true, isPinned: true },
  });
  if (!post) return NextResponse.redirect(new URL("/moderator/posts", req.url));

  const ok = await checkAccess(session.user.id, session.user.role as string, post.forumId);
  if (!ok) return NextResponse.redirect(new URL("/moderator", req.url));

  // 限制：同版最多 maxPinnedPosts
  if (!post.isPinned) {
    const forum = await db.forum.findUnique({ where: { id: post.forumId }, select: { maxPinnedPosts: true } });
    const pinnedCount = await db.post.count({ where: { forumId: post.forumId, isPinned: true } });
    if (pinnedCount >= (forum?.maxPinnedPosts ?? 2)) {
      return NextResponse.redirect(new URL("/moderator/posts?msg=pin_limit", req.url));
    }
  }

  await db.post.update({
    where: { id: params.postId },
    data: {
      isPinned: !post.isPinned,
      pinnedAt: post.isPinned ? null : new Date(),
    },
  });
  await db.adminLog.create({
    data: {
      adminId: session.user.id,
      action: post.isPinned ? "POST_UNPIN" : "POST_PIN",
      targetType: "Post", targetId: params.postId,
      detail: `[MOD] ${post.isPinned ? "取消" : ""}置頂`,
    },
  }).catch(() => null);

  revalidatePath("/moderator/posts");
  revalidatePath(`/posts/${params.postId}`);
  return NextResponse.redirect(new URL("/moderator/posts", req.url));
}
