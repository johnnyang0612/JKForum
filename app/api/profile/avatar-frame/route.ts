import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_FRAMES = ["gold", "silver", "bronze", "purple", "green"];

// 切換頭框（只能用已購買的）
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const frame = body.frame as string | null;

  if (frame && !VALID_FRAMES.includes(frame)) {
    return NextResponse.json({ success: false, error: "無效的頭框" }, { status: 400 });
  }

  // 暫不檢查擁有狀況（buyItem 已 set；後續若要嚴謹，加擁有紀錄表）
  await db.user.update({
    where: { id: session.user.id },
    data: { avatarFrame: frame },
  });
  return NextResponse.json({ success: true, frame });
}
