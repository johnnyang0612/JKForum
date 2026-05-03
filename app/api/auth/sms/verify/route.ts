/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifySmsMock } from "@/lib/sms-mock";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? "").trim();
  if (!code) {
    return NextResponse.json({ success: false, error: "請輸入驗證碼" }, { status: 400 });
  }
  try {
    const r = await verifySmsMock(session.user.id, code);
    return NextResponse.json({ ...r, success: true });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? "驗證失敗" },
      { status: 400 }
    );
  }
}
