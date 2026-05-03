/**
 * SMS Mock — Demo 用，不真的發
 * 統一驗證碼 123456，前端會自動帶入
 */
import { db } from "./db";

export const MOCK_SMS_CODE = "123456";

export async function sendSmsMock(userId: string, phoneNumber: string, country: string) {
  // 寫入 DB（同時 store sms_code = 123456）
  await db.user.update({
    where: { id: userId },
    data: {
      phoneNumber,
      phoneCountry: country,
      smsCode: MOCK_SMS_CODE,
      smsCodeSentAt: new Date(),
    },
  });
  console.log(`📱 [MOCK SMS] to ${country}${phoneNumber}: code = ${MOCK_SMS_CODE}`);
  return { sent: true, mockCode: MOCK_SMS_CODE };
}

export async function verifySmsMock(userId: string, code: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { smsCode: true, smsCodeSentAt: true, phoneNumber: true, smsVerified: true },
  });
  if (!user) throw new Error("用戶不存在");
  if (!user.phoneNumber) throw new Error("尚未填寫手機號");
  if (user.smsVerified) throw new Error("已驗證過");

  // 檢查碼（mock 模式接受 123456 或 stored code）
  if (code !== MOCK_SMS_CODE && code !== user.smsCode) {
    throw new Error("驗證碼錯誤");
  }
  // 過期檢查（10 分鐘）
  if (user.smsCodeSentAt && Date.now() - user.smsCodeSentAt.getTime() > 10 * 60_000) {
    throw new Error("驗證碼已過期，請重新發送");
  }

  await db.user.update({
    where: { id: userId },
    data: {
      smsVerified: new Date(),
      smsCode: null,
      smsCodeSentAt: null,
    },
  });

  return { success: true, phoneNumber: user.phoneNumber };
}
