import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入", favorites: [] }, { status: 401 });
  }

  const favs = await db.businessAdFavorite.findMany({
    where: { userId: session.user.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 50,
  });
  if (favs.length === 0) return NextResponse.json({ success: true, favorites: [] });

  const adsRaw = await db.businessAd.findMany({
    where: { id: { in: favs.map((f) => f.adId) } },
    select: {
      id: true, title: true, city: true, district: true,
      coverImageUrl: true, tier: true, status: true,
    },
  });
  const adMap = new Map(adsRaw.map((a) => [a.id, a]));

  // 按 favs 順序輸出（DB 排序 + createdAt 次序）
  const favorites = favs
    .map((f) => adMap.get(f.adId))
    .filter((a): a is NonNullable<typeof a> => !!a)
    .map((a) => ({
      id: a.id,
      title: a.title,
      city: a.city,
      district: a.district,
      coverImageUrl: a.coverImageUrl,
      tier: a.tier,
      isActive: a.status === "ACTIVE",
    }));

  return NextResponse.json({ success: true, favorites });
}

/** 重新排序：body { order: string[] adId 順序 } — sortOrder 從 0 開始 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { order?: string[] } | null;
  if (!body?.order || !Array.isArray(body.order)) {
    return NextResponse.json({ success: false, error: "order 必須是陣列" }, { status: 400 });
  }
  // 批次更新各列 sortOrder
  await db.$transaction(
    body.order.map((adId, idx) =>
      db.businessAdFavorite.updateMany({
        where: { userId: session.user!.id, adId },
        data: { sortOrder: idx },
      })
    )
  );
  return NextResponse.json({ success: true, count: body.order.length });
}
