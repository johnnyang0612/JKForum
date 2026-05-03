"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

interface RegisterInput {
  username: string;
  displayName: string;
  email: string;
  password: string;
  userType?: "MEMBER" | "BUSINESS";
  merchantName?: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
  devVerificationLink?: string; // Dev mode: 顯示連結
  emailSent?: boolean;
}

export async function registerUser(input: RegisterInput): Promise<ActionResult> {
  try {
    // Check if email already exists
    const existingEmail = await db.user.findUnique({
      where: { email: input.email },
    });

    if (existingEmail) {
      return { success: false, error: "此電子信箱已被使用" };
    }

    // Check if username already exists
    const existingUsername = await db.user.findUnique({
      where: { username: input.username },
    });

    if (existingUsername) {
      return { success: false, error: "此使用者名稱已被使用" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 12);

    const isBusiness = input.userType === "BUSINESS";

    // Create user with profile and initial points
    const newUser = await db.user.create({
      data: {
        username: input.username,
        displayName: input.displayName,
        email: input.email,
        hashedPassword,
        role: "USER",
        status: "ACTIVE",
        userType: isBusiness ? "BUSINESS" : "MEMBER",
        merchantName: isBusiness ? (input.merchantName ?? input.displayName) : null,
        profile: {
          create: {
            bio: "",
          },
        },
        points: {
          create: {
            totalPoints: 0,
            reputation: 0,
            coins: 0,
            platinum: 0,
            level: 16, // 平民
          },
        },
      },
    });

    // 業者：開錢包
    if (isBusiness) {
      await db.businessWallet.create({
        data: { merchantId: newUser.id, balance: 0 },
      });
    }

    // 自動寄驗證信
    let emailSent = false;
    let devVerificationLink: string | undefined;
    try {
      const { sendVerificationEmail } = await import("@/lib/email-verification");
      const r = await sendVerificationEmail(input.email);
      emailSent = r.sent;
      if (!r.sent) devVerificationLink = r.link;
    } catch (e) {
      console.warn("Auto-send verification email failed:", e);
    }

    return { success: true, emailSent, devVerificationLink };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "註冊時發生錯誤，請稍後再試" };
  }
}

export async function requestPasswordReset(email: string): Promise<ActionResult> {
  try {
    const user = await db.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`[Password Reset] Attempted for non-existent email: ${email}`);
      return { success: true };
    }

    // TODO: Generate token, store it, send email
    // For MVP, just log to console
    const resetToken = crypto.randomUUID();
    console.log(`[Password Reset] Token for ${email}: ${resetToken}`);
    console.log(`[Password Reset] Reset link: ${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`);

    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { success: false, error: "發送重設連結時發生錯誤，請稍後再試" };
  }
}

export async function verifyEmail(token: string): Promise<ActionResult> {
  // Placeholder for MVP
  console.log(`[Email Verification] Token received: ${token}`);

  // TODO: Implement token lookup and email verification
  // 1. Find token in database
  // 2. Mark user's email as verified
  // 3. Delete the token

  return { success: true };
}
