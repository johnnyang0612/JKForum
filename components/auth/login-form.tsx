"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickLoading, setQuickLoading] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      if (result.error === "MFA_REQUIRED") {
        setMfaRequired({ email: data.email, password: data.password });
        return;
      }
      setError(result.error);
      return;
    }

    toast.success("登入成功！");
    router.push("/");
    router.refresh();
  };

  const submitMfa = async () => {
    if (!mfaRequired) return;
    setError(null);
    const result = await signIn("credentials", {
      email: mfaRequired.email,
      password: mfaRequired.password,
      mfaToken: mfaCode.trim(),
      redirect: false,
    });
    if (result?.error) {
      setError(result.error === "MFA_REQUIRED" ? "請輸入驗證碼" : result.error);
      return;
    }
    toast.success("登入成功！");
    router.push("/");
    router.refresh();
  };

  const handleQuickLogin = async (email: string, password: string, label: string) => {
    setError(null);
    setQuickLoading(label);
    const result = await signIn("credentials", { email, password, redirect: false });
    setQuickLoading(null);
    if (result?.error) {
      setError(`${label} 登入失敗：${result.error}`);
      return;
    }
    toast.success(`已以 ${label} 身份登入`);
    router.push("/");
    router.refresh();
  };

  if (mfaRequired) {
    return (
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">雙因素驗證</h3>
          <p className="text-sm text-muted-foreground">
            請在驗證 App 中查看 6 位數驗證碼（或使用備用碼）
          </p>
        </div>
        <Input
          placeholder="123456"
          value={mfaCode}
          onChange={(e) => setMfaCode(e.target.value)}
          maxLength={12}
          autoFocus
          className="font-mono text-center text-lg tracking-widest"
          inputMode="numeric"
          onKeyDown={(e) => {
            if (e.key === "Enter") submitMfa();
          }}
        />
        <Button onClick={submitMfa} className="w-full" size="lg">
          驗證並登入
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setMfaRequired(null);
            setMfaCode("");
            setError(null);
          }}
        >
          取消
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* 一鍵測試登入（開發/測試用） */}
      <div className="rounded-lg border-2 border-dashed border-amber-400/60 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
          🧪 測試用一鍵登入（直接點，不用打字）
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={quickLoading === "管理員"}
            disabled={quickLoading !== null || isSubmitting}
            onClick={() =>
              handleQuickLogin("admin@jkforum.com", "Admin123!", "管理員")
            }
          >
            🛡️ 管理員
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={quickLoading === "版主"}
            disabled={quickLoading !== null || isSubmitting}
            onClick={() =>
              handleQuickLogin("moderator_a@jkforum.test", "Test123!", "版主")
            }
          >
            🛠️ 版主
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={quickLoading === "駐站編輯"}
            disabled={quickLoading !== null || isSubmitting}
            onClick={() =>
              handleQuickLogin("editor_a@jkforum.test", "Test123!", "駐站編輯")
            }
          >
            ✍️ 駐站編輯
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={quickLoading === "VIP 會員"}
            disabled={quickLoading !== null || isSubmitting}
            onClick={() =>
              handleQuickLogin("vip_member@jkforum.test", "Test123!", "VIP 會員")
            }
          >
            💎 VIP 會員
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={quickLoading === "資深會員"}
            disabled={quickLoading !== null || isSubmitting}
            onClick={() =>
              handleQuickLogin("sage_old@jkforum.test", "Test123!", "資深會員")
            }
          >
            👑 資深會員
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={quickLoading === "新手"}
            disabled={quickLoading !== null || isSubmitting}
            onClick={() =>
              handleQuickLogin("newbie_a@jkforum.test", "Test123!", "新手")
            }
          >
            🌱 新手會員
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={quickLoading === "業者"}
            disabled={quickLoading !== null || isSubmitting}
            onClick={() =>
              handleQuickLogin("business_demo@jkforum.test", "Test123!", "業者")
            }
            className="col-span-2"
          >
            🏪 業者 demo（已認證）
          </Button>
        </div>
        <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
          訪客體驗請直接關閉此卡，瀏覽下方註冊區或先逛站。
        </p>
      </div>

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
          placeholder="請輸入密碼"
          icon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          autoComplete="current-password"
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

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            {...register("remember")}
          />
          <span className="text-muted-foreground">記住我</span>
        </label>
        <Link
          href="/forgot-password"
          className="rounded-md px-2 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 hover:underline"
        >
          忘記密碼?
        </Link>
      </div>

      <Button
        type="submit"
        className="w-full"
        loading={isSubmitting}
        size="lg"
      >
        登入
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        還沒有帳號？{" "}
        <Link href="/register" className="rounded-md px-2 py-1.5 font-semibold text-primary hover:bg-primary/10 hover:underline">
          立即註冊
        </Link>
      </p>
    </form>
  );
}

export { LoginForm };
