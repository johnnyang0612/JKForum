"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EditProfilePage() {
  const router = useRouter();
  const { data, isLoading } = useSWR("/api/users/me", fetcher);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const user = data?.data;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: formData.get("displayName"),
          bio: formData.get("bio"),
          signature: formData.get("signature"),
          website: formData.get("website"),
          location: formData.get("location"),
        }),
      });

      const result = await res.json();
      if (result.success) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error || "更新失敗");
      }
    });
  }

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-10 rounded bg-muted" />
      ))}
    </div>;
  }

  if (!user) {
    return <p className="text-muted-foreground">無法載入用戶資料</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">個人資料</h2>
        <p className="text-sm text-muted-foreground">編輯你的公開個人資料</p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-success/50 bg-success/10 p-3 text-sm text-success">
          個人資料已更新
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <Input
          label="顯示名稱"
          name="displayName"
          defaultValue={user.displayName}
          maxLength={50}
          required
        />
        <Textarea
          label="自我介紹"
          name="bio"
          defaultValue={user.profile?.bio || ""}
          maxLength={500}
          showCount
          placeholder="簡短介紹自己..."
        />
        <Input
          label="個性簽名"
          name="signature"
          defaultValue={user.profile?.signature || ""}
          maxLength={200}
          placeholder="你的個性簽名"
        />
        <Input
          label="網站"
          name="website"
          type="url"
          defaultValue={user.profile?.website || ""}
          placeholder="https://example.com"
        />
        <Input
          label="所在地"
          name="location"
          defaultValue={user.profile?.location || ""}
          maxLength={100}
          placeholder="例如：台北市"
        />

        <Button type="submit" loading={isPending}>
          儲存變更
        </Button>
      </form>
    </div>
  );
}
