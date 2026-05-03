"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, Lock, Eye, EyeOff, AtSign } from "lucide-react";
import { toast } from "sonner";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { registerUser } from "@/lib/actions/auth-actions";

function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<"MEMBER" | "BUSINESS">("MEMBER");
  const [merchantName, setMerchantName] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false as unknown as true,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);

    if (userType === "BUSINESS" && !merchantName.trim()) {
      setError("請填寫商號名稱");
      return;
    }

    const result = await registerUser({
      username: data.username,
      displayName: data.displayName,
      email: data.email,
      password: data.password,
      userType,
      merchantName: merchantName.trim() || undefined,
    });

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.emailSent) {
      toast.success("註冊成功！驗證信已寄出 📧");
    } else if (result.devVerificationLink) {
      toast.success("註冊成功！(Demo 模式 — 跳轉至驗證頁)");
    } else {
      toast.success("註冊成功！");
    }

    // Auto-login after registration
    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (signInResult?.ok) {
      // 業者 → 業者後台首頁；會員 → 驗證頁
      router.push(userType === "BUSINESS" ? "/business" : "/verify-email");
      router.refresh();
    } else {
      router.push("/login");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* 身分選擇 */}
      <div>
        <label className="mb-2 block text-sm font-medium">註冊身分</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setUserType("MEMBER")}
            className={`rounded-lg border-2 p-3 text-left transition ${
              userType === "MEMBER" ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="font-bold">👤 一般會員</div>
            <div className="mt-0.5 text-xs text-muted-foreground">瀏覽 / 收藏 / 發日誌</div>
          </button>
          <button
            type="button"
            onClick={() => setUserType("BUSINESS")}
            className={`rounded-lg border-2 p-3 text-left transition ${
              userType === "BUSINESS" ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="font-bold">🏢 業者入駐</div>
            <div className="mt-0.5 text-xs text-muted-foreground">刊登業者廣告 / 後台管理</div>
          </button>
        </div>
      </div>

      {userType === "BUSINESS" && (
        <div>
          <label className="mb-1 block text-sm font-medium">商號名稱 *</label>
          <input
            type="text"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
            placeholder="例：台北信義養生館"
            maxLength={60}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            required
          />
        </div>
      )}

      <Input
        label="使用者名稱"
        type="text"
        placeholder="username"
        icon={<AtSign className="h-4 w-4" />}
        error={errors.username?.message}
        autoComplete="username"
        {...register("username")}
      />

      <Input
        label="顯示名稱"
        type="text"
        placeholder="您的暱稱"
        icon={<User className="h-4 w-4" />}
        error={errors.displayName?.message}
        {...register("displayName")}
      />

      <Input
        label="電子信箱"
        type="email"
        placeholder="your@email.com"
        icon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        autoComplete="email"
        {...register("email")}
      />

      <div className="relative">
        <Input
          label="密碼"
          type={showPassword ? "text" : "password"}
          placeholder="至少 8 個字元，含大寫字母和數字"
          icon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          autoComplete="new-password"
          {...register("password")}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="relative">
        <Input
          label="確認密碼"
          type={showConfirm ? "text" : "password"}
          placeholder="再次輸入密碼"
          icon={<Lock className="h-4 w-4" />}
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        <button
          type="button"
          onClick={() => setShowConfirm(!showConfirm)}
          className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          {showConfirm ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          {...register("agreeTerms")}
        />
        <span className="text-muted-foreground">
          我同意{" "}
          <Link href="/terms" className="text-primary hover:underline">
            使用條款
          </Link>
          {" "}和{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            隱私政策
          </Link>
        </span>
      </label>
      {errors.agreeTerms && (
        <p className="text-xs text-danger">{errors.agreeTerms.message}</p>
      )}

      <Button
        type="submit"
        className="w-full"
        loading={isSubmitting}
        size="lg"
      >
        註冊
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        已有帳號？{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          立即登入
        </Link>
      </p>
    </form>
  );
}

export { RegisterForm };
