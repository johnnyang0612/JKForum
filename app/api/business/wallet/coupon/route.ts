/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// 預檢：算這個 code 對 amount 的折扣
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? "").trim().toUpperCase();
  const amount = Math.floor(Number(body.amount));
  if (!code || amount < 100) {
    return NextResponse.json({ success: false, error: "code 或金額無效" }, { status: 400 });
  }
  const coupon = await db.couponCode.findUnique({ where: { code } });
  if (!coupon || !coupon.isActive) return NextResponse.json({ success: false, error: "折扣碼無效" }, { status: 400 });
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return NextResponse.json({ success: false, error: "折扣碼已過期" }, { status: 400 });
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return NextResponse.json({ success: false, error: "折扣碼已用罄" }, { status: 400 });
  if (amount < coupon.minAmount) return NextResponse.json({ success: false, error: `最低需 NT$ ${coupon.minAmount}` }, { status: 400 });

  const used = await db.couponRedemption.findUnique({
    where: { couponId_userId: { couponId: coupon.id, userId: session.user.id } },
  });
  if (used) return NextResponse.json({ success: false, error: "您已使用過此折扣碼" }, { status: 400 });

  let bonus = 0;
  let discount = 0;
  if (coupon.type === "PERCENT") discount = Math.floor(amount * (coupon.value / 100));
  else if (coupon.type === "FIXED") discount = coupon.value;
  else if (coupon.type === "BONUS") bonus = coupon.value;

  const remaining = coupon.maxUses ? Math.max(0, coupon.maxUses - coupon.usedCount) : null;

  return NextResponse.json({
    success: true,
    coupon: {
      id: coupon.id, code: coupon.code, type: coupon.type, value: coupon.value,
      description: coupon.description,
      remaining,                                  // null = 無限
      expiresAt: coupon.expiresAt?.toISOString() ?? null,
      perUserLimit: 1,                            // schema unique([couponId, userId]) 強制每人 1 次
    },
    amount,
    discount,
    bonus,
    payable: Math.max(0, amount - discount),
    credited: amount + bonus, // 入帳金額（含贈點）
  });
}
