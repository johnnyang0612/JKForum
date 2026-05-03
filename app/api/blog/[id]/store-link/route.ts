/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// 將消費者寫的「日誌」綁定到一個業者廣告（PRD: 防止假評）
// 同時可帶 rating: 1~5；會更新 ad.ratingAvg / ratingCount
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });

  const blog = await db.blog.findUnique({
    where: { id: params.id },
    select: { id: true, authorId: true, storeLink: true },
  });
  if (!blog) return NextResponse.json({ success: false, error: "日誌不存在" }, { status: 404 });
  if (blog.authorId !== session.user.id) {
    return NextResponse.json({ success: false, error: "非作者" }, { status: 403 });
  }
  if (blog.storeLink) {
    return NextResponse.json({ success: false, error: "已綁定，不可變更" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const adId = String(body.adId ?? "").trim();
  const rating = body.rating == null ? null : Math.max(1, Math.min(5, Math.floor(Number(body.rating))));

  if (!adId) return NextResponse.json({ success: false, error: "缺 adId" }, { status: 400 });

  const ad = await db.businessAd.findUnique({
    where: { id: adId },
    select: { id: true, status: true, ratingAvg: true, ratingCount: true },
  });
  if (!ad) return NextResponse.json({ success: false, error: "廣告不存在" }, { status: 404 });
  if (ad.status !== "ACTIVE" && ad.status !== "EXPIRED") {
    return NextResponse.json({ success: false, error: "廣告未上架" }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    await tx.blogStoreLink.create({
      data: { blogId: blog.id, adId: ad.id },
    });
    if (rating != null) {
      // 更新廣告平均評分
      const newCount = ad.ratingCount + 1;
      const newAvg = (ad.ratingAvg * ad.ratingCount + rating) / newCount;
      await tx.businessAd.update({
        where: { id: ad.id },
        data: { ratingCount: newCount, ratingAvg: Math.round(newAvg * 100) / 100 },
      });
    }
  });

  return NextResponse.json({ success: true });
}

// 查日誌目前綁定（給編輯器用）
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const link = await db.blogStoreLink.findUnique({
    where: { blogId: params.id },
    select: { adId: true, createdAt: true },
  });
  if (!link) return NextResponse.json({ success: true, link: null });
  const ad = await db.businessAd.findUnique({
    where: { id: link.adId },
    select: { id: true, title: true, city: true, district: true, coverImageUrl: true },
  });
  return NextResponse.json({ success: true, link: { ...link, ad } });
}
