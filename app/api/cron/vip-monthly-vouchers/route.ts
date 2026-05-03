import { NextResponse } from "next/server";
import { grantVipMonthlyVouchers } from "@/lib/voucher-rewards";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * VIP 月卡 voucher — 每天 00:30 跑，1 號和 15 號各發 1 張
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await grantVipMonthlyVouchers();
  return NextResponse.json({ ok: true, ...result, ranAt: new Date().toISOString() });
}
