import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, needLogin: true }, { status: 401 });

  const ad = await db.businessAd.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!ad) return NextResponse.json({ success: false, error: "找不到廣告" }, { status: 404 });

  const exist = await db.businessAdFavorite.findUnique({
    where: { userId_adId: { userId: session.user.id, adId: ad.id } },
  });

  if (exist) {
    await db.$transaction([
      db.businessAdFavorite.delete({ where: { id: exist.id } }),
      db.businessAd.update({ where: { id: ad.id }, data: { favoriteCount: { decrement: 1 } } }),
    ]);
    return NextResponse.json({ success: true, faved: false });
  }
  await db.$transaction([
    db.businessAdFavorite.create({ data: { userId: session.user.id, adId: ad.id } }),
    db.businessAd.update({ where: { id: ad.id }, data: { favoriteCount: { increment: 1 } } }),
  ]);
  return NextResponse.json({ success: true, faved: true });
}
