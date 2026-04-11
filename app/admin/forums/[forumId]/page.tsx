"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateForum, deleteForum } from "@/lib/actions/admin-actions";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminEditForumPage({ params }: { params: { forumId: string } }) {
  const router = useRouter();
  const { data, isLoading } = useSWR(`/api/forums?forumId=${params.forumId}`, fetcher);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const forum = data?.data?.forum;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    formData.set("id", params.forumId);

    startTransition(async () => {
      const result = await updateForum(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  function handleDelete() {
    if (!confirm("確定要刪除此看板嗎？此操作不可復原。")) return;
    startTransition(async () => {
      const result = await deleteForum(params.forumId);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/admin/forums");
      }
    });
  }

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded bg-muted" />)}
    </div>;
  }

  if (!forum) {
    return <p className="text-muted-foreground">看板不存在</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">編輯看板 - {forum.name}</h1>

      {error && (
        <div className="rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-success/50 bg-success/10 p-3 text-sm text-success">看板已更新</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="看板名稱" name="name" defaultValue={forum.name} required maxLength={100} />
        <Textarea label="描述" name="description" defaultValue={forum.description || ""} maxLength={1000} />
        <Textarea label="版規" name="rules" defaultValue={forum.rules || ""} maxLength={5000} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="發文最低等級" name="minLevelToPost" type="number" defaultValue={forum.minLevelToPost} min="0" max="17" />
          <Input label="觀看最低等級" name="minLevelToView" type="number" defaultValue={forum.minLevelToView} min="0" max="17" />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="hidden" name="isVisible" value="false" />
            <input type="checkbox" name="isVisible" value="true" defaultChecked={forum.isVisible} className="rounded" />
            顯示看板
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="hidden" name="isLocked" value="false" />
            <input type="checkbox" name="isLocked" value="true" defaultChecked={forum.isLocked} className="rounded" />
            鎖定看板
          </label>
        </div>
        <div className="flex items-center justify-between">
          <Button type="submit" loading={isPending}>儲存變更</Button>
          <Button type="button" variant="destructive" onClick={handleDelete} loading={isPending}>
            刪除看板
          </Button>
        </div>
      </form>
    </div>
  );
}
