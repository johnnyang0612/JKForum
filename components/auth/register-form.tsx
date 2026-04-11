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

    const result = await registerUser({
      username: data.username,
      displayName: data.displayName,
      email: data.email,
      password: data.password,
    });

    if (result.error) {
      setError(result.error);
      return;
    }

    toast.success("註冊成功！正在自動登入...");

    // Auto-login after registration
    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (signInResult?.ok) {
      router.push("/");
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
