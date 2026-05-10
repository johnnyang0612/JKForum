import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * 站長/版主置頂帖子
 * - 權限：ADMIN / SUPER_ADMIN / 該 forum 的 ForumModerator
 * - 上限：每板 forum.maxPinnedPosts（預設 2）
 *
 * POST   /api/posts/:postId/pin    → 置頂
 * DELETE /api/posts/:postId/pin    → 取消置頂
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { postId: string } }
) {
  return setPin(params.postId, true);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { postId: string } }
) {
  return setPin(params.postId, false);
}

async function setPin(postId: string, pinned: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "請先登入" }, { status: 401 });
  }

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, forumId: true, isPinned: true },
  });
  if (!post) {
    return NextResponse.json({ success: false, error: "文章不存在" }, { status: 404 });
  }

  // 權限：站長 (ADMIN/SUPER_ADMIN) 或該版版主
  const role = session.user.role;
  const isStaff = role === "ADMIN" || role === "SUPER_ADMIN";
  if (!isStaff) {
    const mod = await db.forumModerator.findUnique({
      where: { forumId_userId: { forumId: post.forumId, userId: session.user.id } },
      select: { id: true },
    });
    if (!mod) {
      return NextResponse.json(
        { success: false, error: "只有站長或本板版主可以置頂" },
        { status: 403 }
      );
    }
  }

  if (pinned && post.isPinned) {
    return NextResponse.json({ success: true, alreadyPinned: true });
  }
  if (!pinned && !post.isPinned) {
    return NextResponse.json({ success: true, alreadyUnpinned: true });
  }

  if (pinned) {
    // 上限檢查
    const forum = await db.forum.findUnique({
      where: { id: post.forumId },
      select: { maxPinnedPosts: true, name: true },
    });
    const cap = forum?.maxPinnedPosts ?? 2;
    const currentPinned = await db.post.count({
      where: { forumId: post.forumId, isPinned: true, status: "PUBLISHED" },
    });
    if (currentPinned >= cap) {
      return NextResponse.json(
        {
          success: false,
          error: `「${forum?.name ?? "本版"}」已達置頂上限 ${cap} 篇，請先取消其他置頂`,
        },
        { status: 409 }
      );
    }
  }

  await db.post.update({
    where: { id: postId },
    data: {
      isPinned: pinned,
      pinnedAt: pinned ? new Date() : null,
    },
  });

  return NextResponse.json({ success: true, isPinned: pinned });
}
