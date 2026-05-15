import { NextResponse } from "next/server";
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
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  if (favs.length === 0) return NextResponse.json({ success: true, favorites: [] });

  const ads = await db.businessAd.findMany({
    where: { id: { in: favs.map((f) => f.adId) } },
    select: {
      id: true, title: true, city: true, district: true,
      coverImageUrl: true, tier: true, status: true,
    },
  });

  return NextResponse.json({
    success: true,
    favorites: ads.map((a) => ({
      id: a.id,
      title: a.title,
      city: a.city,
      district: a.district,
      coverImageUrl: a.coverImageUrl,
      tier: a.tier,
      isActive: a.status === "ACTIVE",
    })),
  });
}
