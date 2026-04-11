"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AccountSettingsPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!currentPassword || !newPassword) {
      setError("請填寫所有欄位");
      return;
    }
    if (newPassword.length < 8) {
      setError("新密碼至少 8 個字元");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("兩次輸入的密碼不一致");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await res.json();
      if (result.success) {
        setSuccess(true);
        (e.target as HTMLFormElement).reset();
      } else {
        setError(result.error || "更新失敗");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">帳號安全</h2>
        <p className="text-sm text-muted-foreground">更改你的密碼</p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-success/50 bg-success/10 p-3 text-sm text-success">
          密碼已更新
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <Input
          label="目前密碼"
          name="currentPassword"
          type="password"
          required
        />
        <Input
          label="新密碼"
          name="newPassword"
          type="password"
          required
          placeholder="至少 8 個字元"
        />
        <Input
          label="確認新密碼"
          name="confirmPassword"
          type="password"
          required
        />

        <Button type="submit" loading={isPending}>
          更新密碼
        </Button>
      </form>
    </div>
  );
}
