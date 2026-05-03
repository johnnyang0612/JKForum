/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCredit, purchaseCreditsWithCoins } from "@/lib/download-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: true, balance: 0, anonymous: true });
  }
  const balance = await getCredit(session.user.id);
  // 最近 10 筆交易
  const recent = await db.downloadCreditLedger.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return NextResponse.json({ success: true, balance, recent });
}

// 用金幣換 credits
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const credits = Math.max(1, Math.min(1000, Number(body.credits ?? 1)));
  try {
    const result = await purchaseCreditsWithCoins(session.user.id, credits);
    return NextResponse.json({ success: true, balance: result.balance, gained: credits });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? "兌換失敗" },
      { status: 400 }
    );
  }
}
