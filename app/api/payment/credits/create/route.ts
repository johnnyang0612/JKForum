/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCreditsPaymentOrder } from "@/lib/payment-mock";
import type { PaymentMethod } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_METHODS: PaymentMethod[] = ["ECPAY", "NEWEBPAY", "STRIPE"];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const credits = Math.max(10, Math.min(1000, Number(body.credits ?? 10)));
  const method = body.method as PaymentMethod;
  if (!VALID_METHODS.includes(method)) {
    return NextResponse.json({ success: false, error: "無效付款方式" }, { status: 400 });
  }
  try {
    const order = await createCreditsPaymentOrder({
      userId: session.user.id,
      credits,
      paymentMethod: method,
    });
    return NextResponse.json({
      success: true,
      orderId: order.id,
      checkoutUrl: `/checkout/mock?orderId=${order.id}&kind=credits`,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? "建單失敗" },
      { status: 400 }
    );
  }
}
