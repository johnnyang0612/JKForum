import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyTotp, generateBackupCodes } from "@/lib/mfa";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  if (!token) return NextResponse.json({ error: "缺少驗證碼" }, { status: 400 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
  });
  if (!user?.twoFactorSecret) {
    return NextResponse.json({ error: "尚未設定 MFA" }, { status: 400 });
  }

  if (!verifyTotp(user.twoFactorSecret, token)) {
    return NextResponse.json({ error: "驗證碼錯誤或已過期" }, { status: 400 });
  }

  // First verification → enable MFA + generate backup codes
  if (!user.twoFactorEnabled) {
    const codes = generateBackupCodes(10);
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(codes),
      },
    });
    return NextResponse.json({ success: true, enabled: true, backupCodes: codes });
  }

  return NextResponse.json({ success: true, enabled: true });
}
