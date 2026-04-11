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
      setError(result.error);
      return;
    }

    toast.success("登入成功！");
    router.push("/");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

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
          className="text-sm text-primary hover:underline"
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
        <Link href="/register" className="font-medium text-primary hover:underline">
          立即註冊
        </Link>
      </p>
    </form>
  );
}

export { LoginForm };
