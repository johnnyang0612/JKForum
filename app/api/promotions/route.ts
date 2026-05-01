/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { buyPromotionWithCoins, redeemPromotionVoucher, PROMO_CONFIGS } from "@/lib/promotions";
import type { PromotionType } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET — 取得商品配置 + 用戶持有的 vouchers
export async function GET() {
  const session = await getServerSession(authOptions);
  let vouchers: any[] = [];
  if (session?.user) {
    vouchers = await db.promotionVoucher.findMany({
      where: { userId: session.user.id, usedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }
  return NextResponse.json({ success: true, configs: PROMO_CONFIGS, vouchers });
}

// POST — 購買 / 使用置頂卡
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const postId = String(body.postId ?? "");
  const type = body.type as PromotionType | undefined;
  const voucherId = body.voucherId ? String(body.voucherId) : undefined;

  if (!postId) {
    return NextResponse.json({ success: false, error: "缺少 postId" }, { status: 400 });
  }

  try {
    if (voucherId) {
      const result = await redeemPromotionVoucher({ userId: session.user.id, postId, voucherId });
      return NextResponse.json({ success: true, method: "voucher", ...result });
    }
    if (!type) {
      return NextResponse.json({ success: false, error: "缺少 type" }, { status: 400 });
    }
    const result = await buyPromotionWithCoins({ userId: session.user.id, postId, type });
    return NextResponse.json({ success: true, method: "coins", ...result });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? "購買失敗" },
      { status: 400 }
    );
  }
}
