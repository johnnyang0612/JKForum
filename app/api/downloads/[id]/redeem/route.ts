/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redeemDownload } from "@/lib/download-engine";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const payWith = body.payWith === "coins" ? "coins" : "credits";
  try {
    const result = await redeemDownload({
      userId: session.user.id,
      resourceId: params.id,
      payWith,
    });
    return NextResponse.json({
      success: true,
      ...result,
      downloadUrl: result.resource.fileUrl,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? "下載失敗" },
      { status: 400 }
    );
  }
}
