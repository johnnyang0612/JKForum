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

        {/* PRD-0503：業者付費刊登 */}
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <h3 className="font-bold">🏢 業者付費刊登</h3>
          <label className="flex items-center gap-2 text-sm">
            <input type="hidden" name="allowPaidListing" value="false" />
            <input type="checkbox" name="allowPaidListing" value="true" defaultChecked={forum.allowPaidListing} className="rounded" />
            開放此版區業者付費刊登（顯示 9:16 listing）
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs">預設等級</label>
              <select name="defaultAdTier" defaultValue={forum.defaultAdTier ?? "FREE"}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="FREE">免費</option>
                <option value="T500">T500 (NT$500)</option>
                <option value="T1000">T1000 (NT$1,000)</option>
                <option value="T2000">T2000 (NT$2,000)</option>
                <option value="T3000">T3000 (NT$3,000)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs">主題分類（逗號或空白分隔，最多 20 個）</label>
              <input name="themeCategoriesRaw" defaultValue={(forum.themeCategoriesJson as string[] | null)?.join(", ") ?? ""}
                placeholder="例：指油壓, 制服, 禮服"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="hidden" name="forceThemeCategory" value="false" />
            <input type="checkbox" name="forceThemeCategory" value="true" defaultChecked={forum.forceThemeCategory} className="rounded" />
            刊登時強制要選主題
          </label>
        </div>

        {/* 站長/版主置頂上限 */}
        <div className="space-y-2 rounded-xl border bg-card p-4">
          <h3 className="font-bold">📌 置頂設定</h3>
          <Input
            label="每板置頂上限（站長/版主可置頂的最多篇數）"
            name="maxPinnedPosts"
            type="number"
            defaultValue={forum.maxPinnedPosts ?? 2}
            min="0"
            max="10"
          />
          <p className="text-xs text-muted-foreground">
            預設 2。置頂貼文永遠固定在版面前端，不受其他排序規則影響。
          </p>
        </div>

        {/* 進階搜尋 filter (JSON) */}
        <div className="space-y-2 rounded-xl border bg-card p-4">
          <h3 className="font-bold">🔍 進階搜尋 Filter（JSON）</h3>
          <p className="text-xs text-muted-foreground">
            每個版區可以自訂自己的進階搜尋條件。格式為 array，每筆 <code>{`{ key, label, type }`}</code>，
            type 可為 <code>select</code>（單選）/ <code>multiselect</code>（多選）/ <code>range</code>（區間）。
            例：<br />
            <code>{`[{"key":"bodyType","label":"外型","type":"multiselect","options":["纖細","豐滿"]}]`}</code>
          </p>
          <Textarea
            label="filter 定義"
            name="advancedFiltersRaw"
            rows={10}
            defaultValue={JSON.stringify(forum.advancedFiltersJson ?? [], null, 2)}
          />
          <p className="text-xs text-muted-foreground">
            存檔時系統會驗證格式；無效項目會被忽略。
          </p>
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
