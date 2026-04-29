/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buyItem } from "@/lib/game-engine";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const slug = String(body.slug ?? "");
  const qty = Math.max(1, Math.min(99, Number(body.qty ?? 1)));
  if (!slug) {
    return NextResponse.json({ success: false, error: "缺少道具 slug" }, { status: 400 });
  }
  try {
    const result = await buyItem(session.user.id, slug, qty);
    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message ?? "購買失敗" },
      { status: 400 }
    );
  }
}
