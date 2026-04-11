import { NextResponse } from "next/server";
import { getShopItems } from "@/lib/services/shop-service";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await getShopItems();

    return NextResponse.json({
      success: true,
      data: { items },
    });
  } catch (error) {
    console.error("Get shop items error:", error);
    return NextResponse.json(
      { success: false, error: "載入商城失敗" },
      { status: 500 }
    );
  }
}
