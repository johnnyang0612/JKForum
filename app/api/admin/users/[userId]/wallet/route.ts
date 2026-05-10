import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(_req: NextRequest, ctx: { params: { userId: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  const wallet = await db.businessWallet.findUnique({
    where: { merchantId: ctx.params.userId },
  });
  if (!wallet) return NextResponse.json({ wallet: null, txs: [] });

  const txs = await db.businessWalletTx.findMany({
    where: { merchantId: ctx.params.userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ wallet, txs });
}
