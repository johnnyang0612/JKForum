import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";

export const metadata: Metadata = {
  title: "註冊",
};

export default function RegisterPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">建立帳號</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          加入 JKForum 社群，開始分享與討論
        </p>
      </div>

      <RegisterForm />
      <SocialLoginButtons />
    </div>
  );
}
