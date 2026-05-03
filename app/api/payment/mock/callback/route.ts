/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  handlePromotionPaymentCallback,
  handleVipPaymentCallback,
  handleCreditsPaymentCallback,
} from "@/lib/payment-mock";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const orderId = String(body.orderId ?? "");
  if (!orderId) {
    return NextResponse.json({ success: false, error: "缺少 orderId" }, { status: 400 });
  }
  const order = await db.promotionOrder.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: "訂單不存在" }, { status: 404 });
  }

  try {
    if (order.note?.startsWith("VIP_")) {
      const r = await handleVipPaymentCallback(orderId);
      return NextResponse.json({
        success: true,
        kind: "vip",
        ...r,
        redirectUrl: "/vip",
      });
    }
    if (order.note?.startsWith("CREDITS_")) {
      const r = await handleCreditsPaymentCallback(orderId);
      return NextResponse.json({
        success: true,
        kind: "credits",
        ...r,
        redirectUrl: "/downloads",
      });
    }
    // 預設置頂訂單
    const r = await handlePromotionPaymentCallback(orderId);
    return NextResponse.json({
      success: true,
      kind: "promotion",
      ...r,
      redirectUrl: `/posts/${order.postId}`,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? "處理失敗" },
      { status: 400 }
    );
  }
}
