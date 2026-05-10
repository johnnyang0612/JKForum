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
    select: { forumId: true, isFeatured: true },
  });
  if (!post) return NextResponse.redirect(new URL("/moderator/posts", req.url));

  const ok = await checkAccess(session.user.id, session.user.role as string, post.forumId);
  if (!ok) return NextResponse.redirect(new URL("/moderator", req.url));

  await db.post.update({
    where: { id: params.postId },
    data: { isFeatured: !post.isFeatured, featuredAt: post.isFeatured ? null : new Date() },
  });
  await db.adminLog.create({
    data: {
      adminId: session.user.id,
      action: "POST_FEATURE",
      targetType: "Post", targetId: params.postId,
      detail: `[MOD] ${post.isFeatured ? "取消" : ""}精華`,
    },
  }).catch(() => null);

  revalidatePath("/moderator/posts");
  revalidatePath(`/posts/${params.postId}`);
  return NextResponse.redirect(new URL("/moderator/posts", req.url));
}
