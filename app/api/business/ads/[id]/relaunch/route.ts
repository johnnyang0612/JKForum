/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// 一鍵重新上架：複製為 DRAFT，業者編輯後再送審 + 扣款
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });

  const ad = await db.businessAd.findUnique({
    where: { id: params.id },
    include: { tagAssigns: { select: { tagId: true } } },
  });
  if (!ad || ad.merchantId !== session.user.id) {
    return NextResponse.json({ success: false, error: "找不到" }, { status: 404 });
  }

  const newAd = await db.$transaction(async (tx) => {
    const created = await tx.businessAd.create({
      data: {
        merchantId: ad.merchantId, forumId: ad.forumId,
        title: ad.title, description: ad.description,
        city: ad.city, district: ad.district,
        tags: ad.tags as any, coverImageUrl: ad.coverImageUrl,
        imageUrls: ad.imageUrls as any,
        priceMin: ad.priceMin, priceMax: ad.priceMax,
        tier: ad.tier, tierAmountTwd: 0,
        status: "DRAFT",
      },
    });
    if (ad.tagAssigns.length > 0) {
      await tx.businessAdTagAssign.createMany({
        data: ad.tagAssigns.map((t) => ({ adId: created.id, tagId: t.tagId })),
        skipDuplicates: true,
      });
    }
    return created;
  });

  return NextResponse.json({ success: true, newId: newAd.id });
}
