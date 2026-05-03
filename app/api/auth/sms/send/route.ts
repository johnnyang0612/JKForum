/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendSmsMock, MOCK_SMS_CODE } from "@/lib/sms-mock";

export const dynamic = "force-dynamic";

const RATE_LIMIT_MS = 30_000;
const lastSent = new Map<string, number>();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const phone = String(body.phoneNumber ?? "").trim();
  const country = String(body.country ?? "+886").trim();

  if (!/^[0-9]{8,15}$/.test(phone)) {
    return NextResponse.json({ success: false, error: "手機號格式錯誤" }, { status: 400 });
  }

  const last = lastSent.get(session.user.id);
  if (last && Date.now() - last < RATE_LIMIT_MS) {
    const remaining = Math.ceil((RATE_LIMIT_MS - (Date.now() - last)) / 1000);
    return NextResponse.json(
      { success: false, error: `請等 ${remaining} 秒後再發` },
      { status: 429 }
    );
  }
  lastSent.set(session.user.id, Date.now());

  try {
    const r = await sendSmsMock(session.user.id, phone, country);
    return NextResponse.json({
      success: true,
      sent: r.sent,
      // ⚠️ Demo 模式：把驗證碼直接吐回前端，前端會自動填入
      mockCode: MOCK_SMS_CODE,
      note: "Demo 模式：驗證碼為 123456（已自動填入）",
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? "發送失敗" },
      { status: 400 }
    );
  }
}
