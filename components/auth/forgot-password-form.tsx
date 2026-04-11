"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { requestPasswordReset } from "@/lib/actions/auth-actions";

function ForgotPasswordForm() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    const result = await requestPasswordReset(data.email);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">已發送重設連結</h3>
        <p className="text-sm text-muted-foreground">
          重設密碼連結已發送至您的信箱，請檢查您的電子郵件（包括垃圾郵件資料夾）。
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          返回登入
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        請輸入您的註冊信箱，我們將發送密碼重設連結給您。
      </p>

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

      <Button
        type="submit"
        className="w-full"
        loading={isSubmitting}
        size="lg"
      >
        發送重設連結
      </Button>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回登入
        </Link>
      </div>
    </form>
  );
}

export { ForgotPasswordForm };
