import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { moderateAll } from "@/lib/content-moderation";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const score = Math.round(Number(body.score));
  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 500) : "";

  if (!Number.isFinite(score) || score < 1 || score > 5) {
    return NextResponse.json({ error: "分數需 1–5" }, { status: 400 });
  }

  // 確認廣告存在且非業主自評
  const ad = await db.businessAd.findUnique({
    where: { id: params.id },
    select: { id: true, merchantId: true, status: true },
  });
  if (!ad) return NextResponse.json({ error: "廣告不存在" }, { status: 404 });
  if (ad.merchantId === session.user.id) {
    return NextResponse.json({ error: "不能評自己的廣告" }, { status: 400 });
  }

  // 敏感詞
  if (comment) {
    const mod = await moderateAll({ comment });
    if (!mod.ok) {
      return NextResponse.json({ error: `評論含違禁詞：${mod.blocked.join("、")}` }, { status: 400 });
    }
  }

  // upsert（同人對同廣告 1 個評分）
  await db.businessAdRating.upsert({
    where: { adId_userId: { adId: params.id, userId: session.user.id } },
    update: { score, comment: comment || null },
    create: { adId: params.id, userId: session.user.id, score, comment: comment || null },
  });

  // 重算 avg + count
  const agg = await db.businessAdRating.aggregate({
    where: { adId: params.id },
    _avg: { score: true },
    _count: true,
  });
  await db.businessAd.update({
    where: { id: params.id },
    data: {
      ratingAvg: agg._avg.score ?? 0,
      ratingCount: agg._count,
    },
  });

  return NextResponse.json({
    ok: true,
    ratingAvg: agg._avg.score ?? 0,
    ratingCount: agg._count,
  });
}

// 拿評論列表（給廣告詳情頁）
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const ratings = await db.businessAdRating.findMany({
    where: { adId: params.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const userIds = Array.from(new Set(ratings.map((r) => r.userId)));
  const users = userIds.length > 0
    ? await db.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true, displayName: true, username: true,
          profile: { select: { avatarUrl: true } },
        },
      })
    : [];
  const uMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return NextResponse.json({
    ratings: ratings.map((r) => ({
      id: r.id, score: r.score, comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      user: uMap[r.userId] ? {
        id: uMap[r.userId].id,
        displayName: uMap[r.userId].displayName,
        avatarUrl: uMap[r.userId].profile?.avatarUrl ?? null,
      } : null,
    })),
  });
}
