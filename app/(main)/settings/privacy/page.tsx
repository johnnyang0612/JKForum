"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function PrivacySettingsPage() {
  const { data } = useSWR("/api/users/me", fetcher);
  const [isPending, startTransition] = useTransition();
  const [isPublic, setIsPublic] = useState(data?.data?.profile?.isPublic ?? true);
  const [success, setSuccess] = useState(false);

  function handleSave() {
    setSuccess(false);
    startTransition(async () => {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic }),
      });
      const result = await res.json();
      if (result.success) setSuccess(true);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">隱私設定</h2>
        <p className="text-sm text-muted-foreground">管理你的個人檔案隱私</p>
      </div>

      {success && (
        <div className="rounded-lg border border-success/50 bg-success/10 p-3 text-sm text-success">
          設定已儲存
        </div>
      )}

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">公開個人檔案</p>
            <p className="text-xs text-muted-foreground">
              其他用戶可以查看你的個人資料、文章和回覆
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              isPublic ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                isPublic ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      <Button onClick={handleSave} loading={isPending}>
        儲存設定
      </Button>
    </div>
  );
}
