/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPromotionPaymentOrder } from "@/lib/payment-mock";
import { getConfig } from "@/lib/promotions";
import type { PromotionType, PaymentMethod } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_METHODS: PaymentMethod[] = ["ECPAY", "NEWEBPAY", "STRIPE"];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const postId = String(body.postId ?? "");
  const type = body.type as PromotionType;
  const method = body.method as PaymentMethod;
  if (!postId || !type || !VALID_METHODS.includes(method)) {
    return NextResponse.json({ success: false, error: "缺少參數或無效付款方式" }, { status: 400 });
  }
  const config = getConfig(type);
  try {
    const order = await createPromotionPaymentOrder({
      userId: session.user.id,
      postId,
      type,
      paymentMethod: method,
      priceTwd: config.priceTwd,
      durationHours: config.durationHours,
    });
    return NextResponse.json({
      success: true,
      orderId: order.id,
      checkoutUrl: `/checkout/mock?orderId=${order.id}&kind=promotion`,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? "建單失敗" },
      { status: 400 }
    );
  }
}
