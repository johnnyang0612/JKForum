/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { openTreasure, TREASURE_COST, TREASURE_LABELS } from "@/lib/game-engine";
import type { TreasureType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const treasure = body.treasure as TreasureType;
  if (!treasure || !(treasure in TREASURE_COST)) {
    return NextResponse.json({ success: false, error: "無效的寶箱" }, { status: 400 });
  }
  try {
    const result = await openTreasure(session.user.id, treasure);
    return NextResponse.json({
      success: true,
      treasure,
      label: TREASURE_LABELS[treasure],
      ...result,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message ?? "開寶箱失敗" },
      { status: 400 }
    );
  }
}
