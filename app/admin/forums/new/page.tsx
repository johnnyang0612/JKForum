"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { createForum } from "@/lib/actions/admin-actions";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminNewForumPage() {
  const router = useRouter();
  const { data } = useSWR("/api/forums", fetcher);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const categories = data?.data?.categories || [];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createForum(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        router.push("/admin/forums");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">新增看板</h1>

      {error && (
        <div className="rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="分類"
          name="categoryId"
          options={categories.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))}
          placeholder="選擇分類"
          required
        />
        <Input label="看板名稱" name="name" required maxLength={100} />
        <Input label="看板代稱 (slug)" name="slug" required maxLength={100} placeholder="例如：general-discussion" />
        <Textarea label="描述" name="description" maxLength={1000} />
        <Textarea label="版規" name="rules" maxLength={5000} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="發文最低等級" name="minLevelToPost" type="number" defaultValue="16" min="0" max="17" />
          <Input label="觀看最低等級" name="minLevelToView" type="number" defaultValue="16" min="0" max="17" />
        </div>
        <Button type="submit" loading={isPending}>建立看板</Button>
      </form>
    </div>
  );
}
