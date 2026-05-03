/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import { db } from "./db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://jkforum.vercel.app";
const TOKEN_TTL_HOURS = 24;

/**
 * 產生並儲存 Email 驗證 token，回傳完整連結
 * 用 NextAuth 的 VerificationToken model（已存在於 schema）
 */
export async function createVerificationToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_HOURS * 3600_000);

  // 清掉舊 token
  await db.verificationToken.deleteMany({ where: { identifier: email } });
  await db.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  return `${APP_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
}

/**
 * 驗證 token — 成功則 mark User.emailVerified = now
 */
export async function consumeVerificationToken(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string; userId?: string }> {
  const row = await db.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });
  if (!row) return { success: false, error: "Token 無效或已使用" };
  if (row.expires < new Date()) {
    await db.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } });
    return { success: false, error: "Token 已過期" };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return { success: false, error: "用戶不存在" };

  await db.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });
  await db.verificationToken.delete({
    where: { identifier_token: { identifier: email, token } },
  });

  return { success: true, userId: user.id };
}

/**
 * 寄送驗證信
 * - 開發/未配置 SMTP：log 到 console + 回傳連結
 * - 真實寄送：用 Resend / SendGrid（後續接）
 */
export async function sendVerificationEmail(email: string): Promise<{ sent: boolean; link?: string; error?: string }> {
  const link = await createVerificationToken(email);

  // 嘗試 Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "JKForum <onboarding@resend.dev>",
          to: [email],
          subject: "驗證您的 JKForum 帳號",
          html: emailHtml(link),
        }),
      });
      if (res.ok) return { sent: true, link };
      const errText = await res.text();
      console.error("Resend failed:", res.status, errText);
      return { sent: false, link, error: errText };
    } catch (e: any) {
      console.error("Resend error:", e);
      return { sent: false, link, error: e?.message };
    }
  }

  // 沒設 SMTP — 開發模式：log
  console.log("\n📧 [DEV MODE] Email 驗證連結（沒設 RESEND_API_KEY，請手動點）：");
  console.log("  收件人：", email);
  console.log("  連結：", link);
  console.log("");
  return { sent: false, link, error: "未配置 RESEND_API_KEY (開發模式 log 已輸出)" };
}

function emailHtml(link: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; color: #1a1a1a;">
  <div style="text-align: center; padding: 32px 0;">
    <h1 style="font-size: 28px; margin: 0; color: #2563eb;">JKForum</h1>
    <p style="color: #666; margin-top: 8px;">綜合型社群論壇平台</p>
  </div>
  <div style="background: #f9fafb; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
    <h2 style="margin-top: 0;">驗證您的 Email</h2>
    <p>歡迎加入 JKForum！請點擊下方按鈕驗證您的 Email，即可開始發文、回覆、打賞。</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${link}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        驗證 Email
      </a>
    </div>
    <p style="color: #666; font-size: 13px;">若按鈕無法點擊，請複製以下連結到瀏覽器：</p>
    <p style="background: white; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 12px; color: #666;">
      ${link}
    </p>
    <p style="color: #999; font-size: 12px; margin-top: 24px;">
      連結 24 小時內有效。如果您沒有註冊 JKForum，請忽略此信。
    </p>
  </div>
  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 24px;">
    JKForum © 2026
  </p>
</body>
</html>
  `;
}
