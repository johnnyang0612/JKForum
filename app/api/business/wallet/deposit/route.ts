import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildDepositPayload, payuniEnabled } from "@/lib/payuni";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const amount = Math.floor(Number(body.amount));
  const couponCode = body.couponCode ? String(body.couponCode).trim().toUpperCase() : null;
  if (!amount || amount < 100 || amount > 1_000_000) {
    return NextResponse.json({ success: false, error: "金額需介於 100 ~ 1,000,000" }, { status: 400 });
  }

  // 確保是業者
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { userType: true, email: true },
  });
  if (me?.userType !== "BUSINESS") {
    return NextResponse.json({ success: false, error: "非業者帳號" }, { status: 403 });
  }

  // 折扣碼驗證
  let bonus = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await db.couponCode.findUnique({ where: { code: couponCode } });
    if (!coupon || !coupon.isActive) return NextResponse.json({ success: false, error: "折扣碼無效" }, { status: 400 });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return NextResponse.json({ success: false, error: "折扣碼過期" }, { status: 400 });
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return NextResponse.json({ success: false, error: "折扣碼用罄" }, { status: 400 });
    if (amount < coupon.minAmount) return NextResponse.json({ success: false, error: `最低需 NT$ ${coupon.minAmount}` }, { status: 400 });
    const used = await db.couponRedemption.findUnique({
      where: { couponId_userId: { couponId: coupon.id, userId: session.user.id } },
    });
    if (used) return NextResponse.json({ success: false, error: "已使用過此碼" }, { status: 400 });
    if (coupon.type === "BONUS") bonus = coupon.value;
    // PERCENT/FIXED 折扣不影響到帳金額（demo 模式直接到帳，PAYUNi 模式應扣 payable）
  }

  // 有 PAYUNi 設定 → 跳轉至金流；沒設 → demo 直接入帳
  if (payuniEnabled()) {
    const orderId = `JKF${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const payload = buildDepositPayload({
      orderId, amount,
      productName: `JKForum 業者儲值 NT$${amount}`,
      email: me.email,
      notifyUrl: `${origin}/api/business/wallet/payuni-callback`,
      returnUrl: `${origin}/business/wallet?paid=1`,
    });
    // 暫存 pending（用 walletTx 標 ADMIN_ADJUST 0 占位 + relatedId orderId）
    await db.businessWalletTx.create({
      data: {
        merchantId: session.user.id, type: "ADMIN_ADJUST", amount: 0, balance: 0,
        relatedId: orderId, note: `PENDING PAYUNi orderId=${orderId} amount=${amount}`,
      },
    });
    return NextResponse.json({
      success: true, redirect: { url: payload.url, fields: payload.fields },
    });
  }

  // demo 模式：直接到帳（含 bonus 贈點）
  const credited = amount + bonus;
  await db.$transaction(async (tx) => {
    const wallet = await tx.businessWallet.upsert({
      where: { merchantId: session.user.id },
      create: {
        merchantId: session.user.id, balance: credited, totalDeposit: amount,
      },
      update: {
        balance: { increment: credited },
        totalDeposit: { increment: amount },
      },
    });
    await tx.businessWalletTx.create({
      data: {
        merchantId: session.user.id, type: "DEPOSIT", amount: credited,
        balance: wallet.balance,
        note: `demo 儲值${bonus > 0 ? `（含贈點 ${bonus}）` : ""}${coupon ? ` 折扣碼 ${coupon.code}` : ""}`,
      },
    });
    if (coupon) {
      await tx.couponRedemption.create({
        data: { couponId: coupon.id, userId: session.user.id, amount, bonus },
      });
      await tx.couponCode.update({
        where: { id: coupon.id }, data: { usedCount: { increment: 1 } },
      });
    }
  });

  return NextResponse.json({ success: true, credited, bonus });
}
