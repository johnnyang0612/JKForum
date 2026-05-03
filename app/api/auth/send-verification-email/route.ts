import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email-verification";

export const dynamic = "force-dynamic";

const RATE_LIMIT_MS = 60_000; // 60s
const lastSent = new Map<string, number>();

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true },
  });
  if (!user) {
    return NextResponse.json({ success: false, error: "用戶不存在" }, { status: 404 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ success: false, error: "已驗證過" }, { status: 400 });
  }

  // Rate limit 60s
  const last = lastSent.get(user.email);
  if (last && Date.now() - last < RATE_LIMIT_MS) {
    const remaining = Math.ceil((RATE_LIMIT_MS - (Date.now() - last)) / 1000);
    return NextResponse.json(
      { success: false, error: `請等待 ${remaining} 秒後再試` },
      { status: 429 }
    );
  }
  lastSent.set(user.email, Date.now());

  const result = await sendVerificationEmail(user.email);
  return NextResponse.json({
    success: true,
    sent: result.sent,
    note: result.sent
      ? "驗證信已寄出，請查看信箱"
      : "未配置寄信服務（dev mode），請查看 server log 或請管理員協助",
    devLink: !result.sent ? result.link : undefined,
  });
}
