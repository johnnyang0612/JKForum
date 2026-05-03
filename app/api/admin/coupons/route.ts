/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-log";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? "").trim().toUpperCase();
  const type = body.type as "PERCENT" | "FIXED" | "BONUS";
  const value = Math.floor(Number(body.value));
  if (!/^[A-Z0-9_-]{3,20}$/.test(code)) return NextResponse.json({ success: false, error: "CODE 3-20 字 (英數/_/-)" }, { status: 400 });
  if (!["PERCENT", "FIXED", "BONUS"].includes(type)) return NextResponse.json({ success: false, error: "type 錯" }, { status: 400 });
  if (value <= 0) return NextResponse.json({ success: false, error: "value 需 > 0" }, { status: 400 });

  const exists = await db.couponCode.findUnique({ where: { code } });
  if (exists) return NextResponse.json({ success: false, error: "code 已存在" }, { status: 400 });

  const coupon = await db.couponCode.create({
    data: {
      code, type, value,
      minAmount: Math.max(0, Math.floor(Number(body.minAmount ?? 0))),
      maxUses: body.maxUses ? Math.floor(Number(body.maxUses)) : null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      description: body.description || null,
      createdBy: session.user.id,
    },
  });
  await logAdminAction({
    adminId: session.user.id, action: "COUPON_CREATE",
    targetType: "CouponCode", targetId: coupon.id,
    detail: `${coupon.code} ${coupon.type} ${coupon.value}${coupon.type === "PERCENT" ? "%" : ""}`,
  });
  return NextResponse.json({ success: true, coupon });
}
