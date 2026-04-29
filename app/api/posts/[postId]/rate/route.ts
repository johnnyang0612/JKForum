import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canDo } from "@/lib/user-groups";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { postId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { readPermission: true },
  });
  if (!canDo(me?.readPermission ?? 10, "POST_RATE")) {
    return NextResponse.json(
      { success: false, error: "閱讀權限需 ≥ 20 才能評分" },
      { status: 403 }
    );
  }
  const body = await req.json().catch(() => ({}));
  const score = Math.max(1, Math.min(5, Number(body.score ?? 0)));
  if (!score) {
    return NextResponse.json({ success: false, error: "分數需 1-5" }, { status: 400 });
  }

  // 不能評自己
  const post = await db.post.findUnique({
    where: { id: params.postId },
    select: { authorId: true },
  });
  if (!post) {
    return NextResponse.json({ success: false, error: "文章不存在" }, { status: 404 });
  }
  if (post.authorId === session.user.id) {
    return NextResponse.json({ success: false, error: "不能評自己的文章" }, { status: 400 });
  }

  await db.postRating.upsert({
    where: { postId_userId: { postId: params.postId, userId: session.user.id } },
    update: { score },
    create: { postId: params.postId, userId: session.user.id, score },
  });

  // 重算 avg
  const agg = await db.postRating.aggregate({
    where: { postId: params.postId },
    _avg: { score: true },
    _count: { score: true },
  });
  await db.post.update({
    where: { id: params.postId },
    data: {
      ratingAvg: agg._avg.score ?? 0,
      ratingCount: agg._count.score,
    },
  });

  return NextResponse.json({
    success: true,
    avg: agg._avg.score,
    count: agg._count.score,
  });
}
