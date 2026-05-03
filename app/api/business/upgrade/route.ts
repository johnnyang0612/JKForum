/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const merchantName = String(body.merchantName ?? "").trim();
  if (!merchantName) {
    return NextResponse.json({ success: false, error: "缺商號" }, { status: 400 });
  }
  await db.user.update({
    where: { id: session.user.id },
    data: { userType: "BUSINESS", merchantName },
  });
  // 開錢包（如沒有）
  await db.businessWallet.upsert({
    where: { merchantId: session.user.id },
    create: { merchantId: session.user.id, balance: 0 },
    update: {},
  });
  return NextResponse.json({ success: true });
}
