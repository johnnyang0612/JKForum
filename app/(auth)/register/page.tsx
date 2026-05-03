import type { Metadata } from "next";
import Link from "next/link";
import { Smartphone } from "lucide-react";
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

      <Link href="/register/phone"
        className="mb-4 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 py-3 text-sm font-medium text-primary hover:bg-primary/10">
        <Smartphone className="h-4 w-4" />
        ⚡ 改用手機 OTP 快速註冊（無需 Email）
      </Link>

      <RegisterForm />
      <SocialLoginButtons />
    </div>
  );
}
