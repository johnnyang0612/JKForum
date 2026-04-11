import { NextRequest, NextResponse } from "next/server";
import { trackClick } from "@/lib/services/ad-service";

export async function POST(
  _request: NextRequest,
  { params }: { params: { adId: string } }
) {
  try {
    const result = await trackClick(params.adId);

    if (!result.success) {
      return NextResponse.json(
        { error: "記錄點擊失敗" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "記錄點擊失敗" },
      { status: 500 }
    );
  }
}
