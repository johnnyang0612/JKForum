import { NextResponse } from "next/server";
import { getShopItem } from "@/lib/services/shop-service";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const item = await getShopItem(params.itemId);

    if (!item) {
      return NextResponse.json(
        { success: false, error: "找不到該商品" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { item },
    });
  } catch (error) {
    console.error("Get shop item error:", error);
    return NextResponse.json(
      { success: false, error: "載入商品失敗" },
      { status: 500 }
    );
  }
}
