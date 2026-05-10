import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const TIER_PRICE: Record<string, number> = { FREE: 0, T500: 500, T1000: 1000, T2000: 2000, T3000: 3000 };

// 一鍵續期：扣款（依當前 tier） + 延長 expiresAt 30 天 + 維持 ACTIVE
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });

  const ad = await db.businessAd.findUnique({ where: { id: params.id } });
  if (!ad || ad.merchantId !== session.user.id) {
    return NextResponse.json({ success: false, error: "找不到" }, { status: 404 });
  }
  if (ad.status !== "ACTIVE" && ad.status !== "EXPIRED") {
    return NextResponse.json({ success: false, error: "僅可續期 ACTIVE/EXPIRED 廣告" }, { status: 400 });
  }

  const price = TIER_PRICE[ad.tier] ?? 0;
  const baseTime = ad.expiresAt && ad.expiresAt > new Date() ? ad.expiresAt : new Date();
  const newExpires = new Date(baseTime.getTime() + 30 * 24 * 3600 * 1000);

  if (price === 0) {
    await db.businessAd.update({
      where: { id: params.id },
      data: { status: "ACTIVE", expiresAt: newExpires },
    });
    return NextResponse.json({ success: true, expiresAt: newExpires.toISOString(), charged: 0 });
  }

  const wallet = await db.businessWallet.findUnique({ where: { merchantId: session.user.id } });
  if (!wallet || wallet.balance < price) {
    return NextResponse.json({ success: false, error: `餘額不足，續期需 NT$${price}` }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    const w = await tx.businessWallet.update({
      where: { merchantId: session.user.id },
      data: { balance: { decrement: price }, totalSpent: { increment: price } },
    });
    await tx.businessAd.update({
      where: { id: params.id },
      data: { status: "ACTIVE", expiresAt: newExpires, tierAmountTwd: price },
    });
    await tx.businessWalletTx.create({
      data: {
        merchantId: session.user.id,
        type: "AD_PAYMENT",
        amount: -price,
        balance: w.balance,
        relatedId: params.id,
        note: `續期 30 天 [${ad.tier}] ${ad.title.slice(0, 20)}`,
      },
    });
  });

  return NextResponse.json({ success: true, expiresAt: newExpires.toISOString(), charged: price });
}
