import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { spendPoints, earnPointsSafe } from "@/lib/points-engine";

const VALID_AMOUNTS = [10, 50, 100, 500, 1000];

export async function POST(
  req: Request,
  { params }: { params: { postId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount);
  const message = typeof body.message === "string" ? body.message.slice(0, 200) : null;

  if (!VALID_AMOUNTS.includes(amount)) {
    return NextResponse.json(
      { error: `金額必須是 ${VALID_AMOUNTS.join(" / ")} 金幣` },
      { status: 400 }
    );
  }

  const post = await db.post.findUnique({
    where: { id: params.postId },
    select: { id: true, authorId: true, forumId: true, title: true },
  });
  if (!post) return NextResponse.json({ error: "文章不存在" }, { status: 404 });

  if (post.authorId === session.user.id) {
    return NextResponse.json({ error: "不能打賞自己" }, { status: 400 });
  }

  // Spend coins (checks balance)
  const spent = await spendPoints({
    userId: session.user.id,
    currency: "coins",
    amount,
    reason: "tip",
    relatedId: post.id,
    relatedType: "post",
    note: `打賞「${post.title.slice(0, 40)}」`,
  });
  if (!spent.granted) {
    return NextResponse.json(
      { error: "金幣不足" },
      { status: 400 }
    );
  }

  // Author gets 80% of coins
  const authorShare = Math.floor(amount * 0.8);
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
      action: "tip_received",
      delta: { coins: authorShare } as object,
      relatedId: post.id,
      relatedType: "post",
      forumId: post.forumId,
      note: `收到打賞 ${amount} 金幣（80% 分潤）`,
    },
  });

  // Rule-based bonuses (author gets +10 名聲 +10 金幣 baseline for each tip)
  await earnPointsSafe({
    userId: post.authorId,
    action: "tip_post",
    relatedId: post.id,
    relatedType: "post",
    forumId: post.forumId,
  });

  // Record the tip
  const tip = await db.tip.create({
    data: {
      fromId: session.user.id,
      toId: post.authorId,
      postId: post.id,
      amount,
      message,
    },
  });

  return NextResponse.json({
    success: true,
    tipId: tip.id,
    amount,
    authorShare,
  });
}
