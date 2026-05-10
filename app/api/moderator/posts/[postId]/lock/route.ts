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
    select: { forumId: true, status: true },
  });
  if (!post) return NextResponse.redirect(new URL("/moderator/posts", req.url));

  const ok = await checkAccess(session.user.id, session.user.role as string, post.forumId);
  if (!ok) return NextResponse.redirect(new URL("/moderator", req.url));

  const newStatus = post.status === "LOCKED" ? "PUBLISHED" : "LOCKED";
  await db.post.update({ where: { id: params.postId }, data: { status: newStatus } });
  await db.adminLog.create({
    data: {
      adminId: session.user.id,
      action: "POST_LOCK",
      targetType: "Post", targetId: params.postId,
      detail: `[MOD] ${newStatus === "LOCKED" ? "鎖定" : "解鎖"}`,
    },
  }).catch(() => null);

  revalidatePath("/moderator/posts");
  revalidatePath(`/posts/${params.postId}`);
  return NextResponse.redirect(new URL("/moderator/posts", req.url));
}
