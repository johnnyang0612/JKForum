import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "請輸入電子信箱")
    .email("請輸入有效的電子信箱格式"),
  password: z.string().min(1, "請輸入密碼"),
  remember: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "使用者名稱至少 3 個字元")
      .max(20, "使用者名稱最多 20 個字元")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "使用者名稱只能包含英文字母、數字和底線"
      ),
    displayName: z
      .string()
      .min(1, "請輸入顯示名稱")
      .max(30, "顯示名稱最多 30 個字元"),
    email: z
      .string()
      .min(1, "請輸入電子信箱")
      .email("請輸入有效的電子信箱格式"),
    password: z
      .string()
      .min(8, "密碼至少 8 個字元")
      .regex(/[A-Z]/, "密碼需包含至少一個大寫英文字母")
      .regex(/[0-9]/, "密碼需包含至少一個數字"),
    confirmPassword: z.string().min(1, "請再次輸入密碼"),
    agreeTerms: z.literal(true, {
      message: "請同意使用條款和隱私政策",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "兩次輸入的密碼不一致",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "請輸入電子信箱")
    .email("請輸入有效的電子信箱格式"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
