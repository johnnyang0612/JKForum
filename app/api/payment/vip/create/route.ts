/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createVipPaymentOrder } from "@/lib/payment-mock";
import type { PaymentMethod } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_METHODS: PaymentMethod[] = ["ECPAY", "NEWEBPAY", "STRIPE"];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const plan = body.plan as "MONTHLY" | "QUARTERLY" | "YEARLY";
  const method = body.method as PaymentMethod;
  if (!["MONTHLY", "QUARTERLY", "YEARLY"].includes(plan) || !VALID_METHODS.includes(method)) {
    return NextResponse.json({ success: false, error: "無效參數" }, { status: 400 });
  }
  try {
    const order = await createVipPaymentOrder({
      userId: session.user.id,
      plan,
      paymentMethod: method,
    });
    return NextResponse.json({
      success: true,
      orderId: order.id,
      checkoutUrl: `/checkout/mock?orderId=${order.id}&kind=vip`,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? "建單失敗" },
      { status: 400 }
    );
  }
}
