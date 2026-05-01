/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exchangeHeartsToEnergy } from "@/lib/game-engine";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount ?? 10);
  try {
    const result = await exchangeHeartsToEnergy(session.user.id, amount);
    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? "兌換失敗" },
      { status: 400 }
    );
  }
}
