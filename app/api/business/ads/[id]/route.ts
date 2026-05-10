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
  const hasTagIds = Array.isArray(body.tagIds);
  const tagIds: string[] = hasTagIds
    ? Array.from(new Set<string>(body.tagIds.map((s: any) => String(s)).filter(Boolean))).slice(0, 100)
    : [];

  // 不允許在 ACTIVE 狀態改 tier
  const data: any = {
    title: body.title ?? undefined,
    description: body.description ?? undefined,
    city: body.city ?? undefined,
    district: body.district ?? undefined,
    tags: Array.isArray(body.tags) ? body.tags.slice(0, 50) : undefined,
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

  // 驗證 tagIds（如有送）
  let validTagIds: string[] = [];
  if (hasTagIds && tagIds.length > 0) {
    const existing = await db.businessAdTag.findMany({
      where: { id: { in: tagIds }, isActive: true },
      select: { id: true },
    });
    validTagIds = existing.map((t) => t.id);
  }

  // 重設 tag 關聯（在 tx 內，避免半成品）
  async function syncTags(tx: typeof db) {
    if (!hasTagIds) return;
    await tx.businessAdTagAssign.deleteMany({ where: { adId: params.id } });
    if (validTagIds.length > 0) {
      await tx.businessAdTagAssign.createMany({
        data: validTagIds.map((tagId) => ({ adId: params.id, tagId })),
        skipDuplicates: true,
      });
    }
  }

  // 送審：DRAFT/REJECTED 重送、tier 升級時計算「差額」(已扣 tierAmountTwd 折抵)
  if (submit && (ad.status === "DRAFT" || ad.status === "REJECTED")) {
    const newTier = body.tier ?? ad.tier;
    const newPrice = TIER_PRICE[newTier] ?? 0;
    const alreadyPaid = ad.tierAmountTwd ?? 0;
    const charge = Math.max(0, newPrice - alreadyPaid); // 差額
    if (charge > 0) {
      const wallet = await db.businessWallet.findUnique({ where: { merchantId: session.user.id } });
      if (!wallet || wallet.balance < charge) {
        return NextResponse.json({ success: false, error: `餘額不足，需補 NT$${charge}（差額）` }, { status: 400 });
      }
      await db.$transaction(async (tx) => {
        const w = await tx.businessWallet.update({
          where: { merchantId: session.user.id },
          data: { balance: { decrement: charge }, totalSpent: { increment: charge } },
        });
        await tx.businessAd.update({
          where: { id: params.id },
          data: { ...data, tier: newTier, tierAmountTwd: newPrice, status: "PENDING" },
        });
        await tx.businessWalletTx.create({
          data: {
            merchantId: session.user.id, type: "AD_PAYMENT", amount: -charge,
            balance: w.balance, relatedId: params.id,
            note: `升級至 ${newTier} 補差額 (已扣 NT$${alreadyPaid}, 補 NT$${charge}) ${(data.title ?? ad.title).slice(0, 20)}`,
          },
        });
        await syncTags(tx as any);
      });
    } else {
      // 沒差額（同 tier 或降級）— 直接送審
      await db.$transaction(async (tx) => {
        await tx.businessAd.update({
          where: { id: params.id },
          data: { ...data, tier: newTier, tierAmountTwd: newPrice, status: "PENDING" },
        });
        await syncTags(tx as any);
      });
    }
  } else {
    await db.$transaction(async (tx) => {
      await tx.businessAd.update({ where: { id: params.id }, data });
      await syncTags(tx as any);
    });
  }

  return NextResponse.json({ success: true });
}
