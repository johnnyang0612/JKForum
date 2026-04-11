import { NextRequest, NextResponse } from "next/server";
import { trackImpression } from "@/lib/services/ad-service";

export async function POST(
  _request: NextRequest,
  { params }: { params: { adId: string } }
) {
  try {
    const result = await trackImpression(params.adId);

    if (!result.success) {
      return NextResponse.json(
        { error: "記錄曝光失敗" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "記錄曝光失敗" },
      { status: 500 }
    );
  }
}
