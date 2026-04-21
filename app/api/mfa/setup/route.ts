import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateMfaSetup } from "@/lib/mfa";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, twoFactorEnabled: true },
  });
  if (!user) return NextResponse.json({ error: "用戶不存在" }, { status: 404 });

  if (user.twoFactorEnabled) {
    return NextResponse.json(
      { error: "已啟用 MFA，請先停用再重新設定" },
      { status: 409 }
    );
  }

  const setup = await generateMfaSetup(user.email);

  // Store pending secret; not enabled until user verifies first code
  await db.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: setup.secret },
  });

  return NextResponse.json({
    qrDataUrl: setup.qrDataUrl,
    secret: setup.secret,
    otpauth: setup.otpauth,
  });
}
