import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "忘記密碼",
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">忘記密碼</h2>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}
