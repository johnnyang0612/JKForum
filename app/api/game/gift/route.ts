/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { giftItem } from "@/lib/game-engine";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const slug = String(body.slug ?? "");
  const toUsername = String(body.toUsername ?? "").trim();
  const qty = Math.max(1, Math.min(10, Number(body.qty ?? 1)));
  if (!slug || !toUsername) {
    return NextResponse.json({ success: false, error: "缺少參數" }, { status: 400 });
  }
  try {
    const result = await giftItem(session.user.id, toUsername, slug, qty);
    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? "贈送失敗" },
      { status: 400 }
    );
  }
}
