import { NextRequest, NextResponse } from "next/server";
import { getAdsForPosition } from "@/lib/services/ad-service";
import { AdPosition } from "@prisma/client";

const VALID_POSITIONS: Set<string> = new Set([
  "HOME_BANNER",
  "SIDEBAR",
  "POST_INLINE",
  "OVERLAY",
  "POPUP",
]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const position = searchParams.get("position");
    const forumId = searchParams.get("forumId") || undefined;

    if (!position || !VALID_POSITIONS.has(position)) {
      return NextResponse.json(
        { error: "無效的廣告位置" },
        { status: 400 }
      );
    }

    const ads = await getAdsForPosition(
      position as AdPosition,
      forumId
    );

    // 只回傳前端需要的欄位
    const result = ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl,
      position: ad.position,
      width: ad.width,
      height: ad.height,
    }));

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "取得廣告失敗" },
      { status: 500 }
    );
  }
}
