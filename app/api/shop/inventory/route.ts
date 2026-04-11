import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserItems } from "@/lib/services/shop-service";

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
    const items = await getUserItems(session.user.id);

    return NextResponse.json({
      success: true,
      data: { items },
    });
  } catch (error) {
    console.error("Get inventory error:", error);
    return NextResponse.json(
      { success: false, error: "載入背包失敗" },
      { status: 500 }
    );
  }
}
