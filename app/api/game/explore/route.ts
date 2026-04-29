/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { explore, EXPLORE_COST, EXPLORE_LABELS } from "@/lib/game-engine";
import type { ExploreLocation } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const location = body.location as ExploreLocation;
  if (!location || !(location in EXPLORE_COST)) {
    return NextResponse.json({ success: false, error: "無效的地形" }, { status: 400 });
  }
  try {
    const result = await explore(session.user.id, location);
    return NextResponse.json({
      success: true,
      location,
      label: EXPLORE_LABELS[location],
      ...result,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message ?? "探索失敗" },
      { status: 400 }
    );
  }
}
