import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { spendPoints, earnPointsSafe } from "@/lib/points-engine";

export async function POST(
  _: Request,
  { params }: { params: { postId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const post = await db.post.findUnique({
    where: { id: params.postId },
    select: { id: true, authorId: true, visibility: true, paidCoins: true, forumId: true, title: true },
  });
  if (!post) return NextResponse.json({ error: "文章不存在" }, { status: 404 });

  if (post.visibility !== "PAID" || post.paidCoins <= 0) {
    return NextResponse.json({ error: "此文章非付費內容" }, { status: 400 });
  }

  if (post.authorId === session.user.id) {
    return NextResponse.json({ error: "作者本人無需解鎖" }, { status: 400 });
  }

  // Already unlocked?
  const existing = await db.postUnlock.findUnique({
    where: { userId_postId: { userId: session.user.id, postId: post.id } },
  });
  if (existing) {
    return NextResponse.json({ success: true, alreadyUnlocked: true });
  }

  // Spend coins
  const result = await spendPoints({
    userId: session.user.id,
    currency: "coins",
    amount: post.paidCoins,
    reason: "post_unlock",
    relatedId: post.id,
    relatedType: "post",
    note: `付費解鎖「${post.title.slice(0, 40)}」`,
  });
  if (!result.granted) {
    return NextResponse.json(
      { error: "金幣不足，請先儲值或簽到累積" },
      { status: 400 }
    );
  }

  // Record unlock
  await db.postUnlock.create({
    data: {
      userId: session.user.id,
      postId: post.id,
      paidCoins: post.paidCoins,
    },
  });

  // Author earns tip_post reward (80% of paid coins, rounded)
  const authorShare = Math.floor(post.paidCoins * 0.8);
  if (authorShare > 0) {
    await db.userPoints.update({
      where: { userId: post.authorId },
      data: {
        coins: { increment: authorShare },
        totalPoints: { increment: authorShare },
      },
    });
    await db.pointLedger.create({
      data: {
        userId: post.authorId,
        action: "post_sold",
        delta: { coins: authorShare } as object,
        relatedId: post.id,
        relatedType: "post",
        forumId: post.forumId,
        note: `文章被解鎖 (分潤 80%)`,
      },
    });
    // Also trigger the rule (for 名聲 + 送出 etc. if configured)
    await earnPointsSafe({
      userId: post.authorId,
      action: "tip_post",
      relatedId: post.id,
      relatedType: "post",
      forumId: post.forumId,
    });
  }

  return NextResponse.json({ success: true, paidCoins: post.paidCoins });
}
