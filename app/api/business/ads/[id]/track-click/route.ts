import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * 廣告卡片點擊追蹤（從 listing 列表 click 進入詳情）。
 * 由 ad-card.tsx 在 onClick 時用 fetch keepalive 觸發，不阻擋 navigation。
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await db.businessAd
    .update({
      where: { id: params.id },
      data: { clickCount: { increment: 1 } },
    })
    .catch(() => null);
  return NextResponse.json({ success: true });
}
