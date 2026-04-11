import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";

export const metadata: Metadata = {
  title: "登入",
};

export default function LoginPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">歡迎回來</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          請登入您的帳號以繼續
        </p>
      </div>

      <LoginForm />
      <SocialLoginButtons />
    </div>
  );
}
