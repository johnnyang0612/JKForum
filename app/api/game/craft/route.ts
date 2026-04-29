/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { craftItem, craftMedal } from "@/lib/game-engine";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const recipeId = String(body.recipeId ?? "");
  const kind = body.kind === "medal" ? "medal" : "item";
  if (!recipeId) {
    return NextResponse.json({ success: false, error: "缺少配方 ID" }, { status: 400 });
  }
  try {
    const result =
      kind === "medal"
        ? await craftMedal(session.user.id, recipeId)
        : await craftItem(session.user.id, recipeId);
    return NextResponse.json({ success: true, kind, ...result });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message ?? "合成失敗" },
      { status: 400 }
    );
  }
}
