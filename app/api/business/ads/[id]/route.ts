/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { moderateAll } from "@/lib/content-moderation";

export const dynamic = "force-dynamic";

const TIER_PRICE: Record<string, number> = { FREE: 0, T500: 500, T1000: 1000, T2000: 2000, T3000: 3000 };

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });

  const ad = await db.businessAd.findUnique({ where: { id: params.id } });
  if (!ad || ad.merchantId !== session.user.id) {
    return NextResponse.json({ success: false, error: "找不到" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const submit = !!body.submit;

  // 不允許在 ACTIVE 狀態改 tier
  const data: any = {
    title: body.title ?? undefined,
    description: body.description ?? undefined,
    city: body.city ?? undefined,
    district: body.district ?? undefined,
    tags: Array.isArray(body.tags) ? body.tags.slice(0, 10) : undefined,
    coverImageUrl: body.coverImageUrl ?? undefined,
    imageUrls: Array.isArray(body.imageUrls)
      ? body.imageUrls.slice(0, 8).map((s: any) => String(s).slice(0, 500))
      : undefined,
    priceMin: body.priceMin === null ? null : (body.priceMin ?? undefined),
    priceMax: body.priceMax === null ? null : (body.priceMax ?? undefined),
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
  };

  // 敏感詞
  const mod = await moderateAll({ title: data.title ?? ad.title, description: data.description ?? ad.description });
  if (!mod.ok) {
    return NextResponse.json({ success: false, error: `含違禁詞：${mod.blocked.join("、")}` }, { status: 400 });
  }

  // 送審：如改了 tier 且非 FREE，需扣款
  if (submit && (ad.status === "DRAFT" || ad.status === "REJECTED")) {
    const newTier = body.tier ?? ad.tier;
    const price = TIER_PRICE[newTier] ?? 0;
    if (price > 0) {
      const wallet = await db.businessWallet.findUnique({ where: { merchantId: session.user.id } });
      if (!wallet || wallet.balance < price) {
        return NextResponse.json({ success: false, error: "餘額不足" }, { status: 400 });
      }
      await db.$transaction(async (tx) => {
        const w = await tx.businessWallet.update({
          where: { merchantId: session.user.id },
          data: { balance: { decrement: price }, totalSpent: { increment: price } },
        });
        await tx.businessAd.update({
          where: { id: params.id },
          data: { ...data, tier: newTier, tierAmountTwd: price, status: "PENDING" },
        });
        await tx.businessWalletTx.create({
          data: {
            merchantId: session.user.id, type: "AD_PAYMENT", amount: -price,
            balance: w.balance, relatedId: params.id,
            note: `重新送審扣款 [${newTier}] ${(data.title ?? ad.title).slice(0, 20)}`,
          },
        });
      });
    } else {
      await db.businessAd.update({
        where: { id: params.id },
        data: { ...data, tier: newTier, tierAmountTwd: 0, status: "PENDING" },
      });
    }
  } else {
    await db.businessAd.update({ where: { id: params.id }, data });
  }

  return NextResponse.json({ success: true });
}
