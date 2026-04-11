import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkVipStatus, getVipHistory } from "@/lib/services/vip-service";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "未登入" },
      { status: 401 }
    );
  }

  try {
    const { isVip, subscription } = await checkVipStatus(session.user.id);
    const history = await getVipHistory(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        isVip,
        subscription,
        history,
      },
    });
  } catch (error) {
    console.error("Get VIP status error:", error);
    return NextResponse.json(
      { success: false, error: "載入 VIP 狀態失敗" },
      { status: 500 }
    );
  }
}
