/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { MOCK_SMS_CODE } from "@/lib/sms-mock";

export const dynamic = "force-dynamic";

/**
 * PRD §1.2 — 純電話號碼註冊
 * step=1: { action:"send", phone, country } → 寄 OTP（demo 直接回 123456）
 * step=2: { action:"verify", phone, country, code, password, displayName, userType, merchantName? }
 */

const RATE_LIMIT_MS = 30_000;
const lastSent = new Map<string, number>();

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const phone = String(body.phone ?? "").replace(/[^0-9]/g, "");
  const country = String(body.country ?? "+886");

  if (!/^[0-9]{8,15}$/.test(phone)) {
    return NextResponse.json({ success: false, error: "手機號格式錯誤" }, { status: 400 });
  }

  if (action === "send") {
    const exist = await db.user.findFirst({ where: { phoneNumber: phone, smsVerified: { not: null } } });
    if (exist) return NextResponse.json({ success: false, error: "此手機號已註冊" }, { status: 400 });

    const last = lastSent.get(phone);
    if (last && Date.now() - last < RATE_LIMIT_MS) {
      const r = Math.ceil((RATE_LIMIT_MS - (Date.now() - last)) / 1000);
      return NextResponse.json({ success: false, error: `請等 ${r} 秒後再發` }, { status: 429 });
    }
    lastSent.set(phone, Date.now());
    console.log(`📱 [phone-register] OTP to ${country}${phone} = ${MOCK_SMS_CODE}`);
    return NextResponse.json({ success: true, mockCode: MOCK_SMS_CODE, note: "Demo 模式：驗證碼 123456" });
  }

  if (action === "verify") {
    const code = String(body.code ?? "").trim();
    const password = String(body.password ?? "");
    const displayName = String(body.displayName ?? "").trim();
    const userType = body.userType === "BUSINESS" ? "BUSINESS" : "MEMBER";
    const merchantName = String(body.merchantName ?? "").trim();

    if (code !== MOCK_SMS_CODE) return NextResponse.json({ success: false, error: "驗證碼錯誤" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ success: false, error: "密碼至少 6 字" }, { status: 400 });
    if (!displayName) return NextResponse.json({ success: false, error: "請填暱稱" }, { status: 400 });
    if (userType === "BUSINESS" && !merchantName) return NextResponse.json({ success: false, error: "業者需填商號" }, { status: 400 });

    const exist = await db.user.findFirst({ where: { phoneNumber: phone, smsVerified: { not: null } } });
    if (exist) return NextResponse.json({ success: false, error: "此手機號已註冊" }, { status: 400 });

    const username = `u${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const fakeEmail = `${username}@phone.jkforum.local`;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.user.create({
      data: {
        email: fakeEmail,
        username,
        displayName,
        hashedPassword,
        emailVerified: null, // 純電話註冊不需要 email 驗證
        phoneNumber: phone,
        phoneCountry: country,
        smsVerified: new Date(),
        userType,
        merchantName: userType === "BUSINESS" ? merchantName : null,
      },
    });
    if (userType === "BUSINESS") {
      await db.businessWallet.create({ data: { merchantId: newUser.id, balance: 0 } });
    }
    return NextResponse.json({
      success: true,
      userId: newUser.id,
      // 用 fakeEmail 給 NextAuth credentials provider 登入
      loginEmail: fakeEmail,
    });
  }

  return NextResponse.json({ success: false, error: "未知動作" }, { status: 400 });
}
