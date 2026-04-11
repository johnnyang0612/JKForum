"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAd, updateAd, deleteAd } from "@/lib/actions/ad-actions";

interface Forum {
  id: string;
  name: string;
}

interface InitialData {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  width: number | null;
  height: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: number;
  targetForums: string | null;
}

interface AdFormProps {
  forums: Forum[];
  initialData?: InitialData;
}

export function AdForm({ forums, initialData }: AdFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!initialData;

  // 解析目標看板
  const initialTargets: string[] = initialData?.targetForums
    ? (() => {
        try {
          return JSON.parse(initialData.targetForums);
        } catch {
          return [];
        }
      })()
    : [];

  const [selectedForums, setSelectedForums] = useState<string[]>(initialTargets);

  const toggleForum = (forumId: string) => {
    setSelectedForums((prev) =>
      prev.includes(forumId)
        ? prev.filter((id) => id !== forumId)
        : [...prev, forumId]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set(
      "targetForums",
      selectedForums.length > 0 ? JSON.stringify(selectedForums) : ""
    );

    if (initialData) {
      formData.set("id", initialData.id);
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateAd(formData)
        : await createAd(formData);

      if ("error" in result) {
        setError(result.error ?? "操作失敗");
      } else {
        router.push("/admin/ads");
      }
    });
  };

  const handleDelete = () => {
    if (!initialData) return;
    if (!confirm("確定要刪除此廣告？此操作無法復原。")) return;

    startTransition(async () => {
      const result = await deleteAd(initialData.id);
      if ("error" in result) {
        setError(result.error ?? "操作失敗");
      } else {
        router.push("/admin/ads");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 標題 */}
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          廣告標題 <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={200}
          defaultValue={initialData?.title}
          placeholder="輸入廣告標題"
          className="w-full h-10 rounded-md border bg-background px-3 text-sm"
        />
      </div>

      {/* 圖片網址 */}
      <div className="space-y-2">
        <label htmlFor="imageUrl" className="text-sm font-medium">
          圖片網址 <span className="text-red-500">*</span>
        </label>
        <input
          id="imageUrl"
          name="imageUrl"
          type="url"
          required
          defaultValue={initialData?.imageUrl}
          placeholder="https://example.com/ad-image.jpg"
          className="w-full h-10 rounded-md border bg-background px-3 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          建議尺寸：橫幅 1200x300、側邊欄 300x600、文章穿插 600x400
        </p>
      </div>

      {/* 連結網址 */}
      <div className="space-y-2">
        <label htmlFor="linkUrl" className="text-sm font-medium">
          連結網址 <span className="text-red-500">*</span>
        </label>
        <input
          id="linkUrl"
          name="linkUrl"
          type="url"
          required
          defaultValue={initialData?.linkUrl}
          placeholder="https://example.com/landing-page"
          className="w-full h-10 rounded-md border bg-background px-3 text-sm"
        />
      </div>

      {/* 廣告位置 */}
      <div className="space-y-2">
        <label htmlFor="position" className="text-sm font-medium">
          廣告位置 <span className="text-red-500">*</span>
        </label>
        <select
          id="position"
          name="position"
          required
          defaultValue={initialData?.position || ""}
          className="w-full h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="" disabled>
            選擇廣告位置
          </option>
          <option value="HOME_BANNER">首頁橫幅</option>
          <option value="SIDEBAR">側邊欄</option>
          <option value="POST_INLINE">文章穿插</option>
          <option value="OVERLAY">蓋版廣告</option>
          <option value="POPUP">彈出式</option>
        </select>
      </div>

      {/* 尺寸 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="width" className="text-sm font-medium">
            寬度 (px)
          </label>
          <input
            id="width"
            name="width"
            type="number"
            min={0}
            defaultValue={initialData?.width ?? ""}
            placeholder="自動"
            className="w-full h-10 rounded-md border bg-background px-3 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="height" className="text-sm font-medium">
            高度 (px)
          </label>
          <input
            id="height"
            name="height"
            type="number"
            min={0}
            defaultValue={initialData?.height ?? ""}
            placeholder="自動"
            className="w-full h-10 rounded-md border bg-background px-3 text-sm"
          />
        </div>
      </div>

      {/* 日期範圍 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="startDate" className="text-sm font-medium">
            開始日期 <span className="text-red-500">*</span>
          </label>
          <input
            id="startDate"
            name="startDate"
            type="datetime-local"
            required
            defaultValue={initialData?.startDate}
            className="w-full h-10 rounded-md border bg-background px-3 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="endDate" className="text-sm font-medium">
            結束日期 <span className="text-red-500">*</span>
          </label>
          <input
            id="endDate"
            name="endDate"
            type="datetime-local"
            required
            defaultValue={initialData?.endDate}
            className="w-full h-10 rounded-md border bg-background px-3 text-sm"
          />
        </div>
      </div>

      {/* 優先級 */}
      <div className="space-y-2">
        <label htmlFor="priority" className="text-sm font-medium">
          優先級
        </label>
        <input
          id="priority"
          name="priority"
          type="number"
          min={0}
          max={999}
          defaultValue={initialData?.priority ?? 0}
          className="w-full h-10 rounded-md border bg-background px-3 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          數字越大越優先顯示（0-999）
        </p>
      </div>

      {/* 目標看板 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">目標看板</label>
        <p className="text-xs text-muted-foreground">
          不選擇任何看板則在所有看板��示
        </p>
        <div className="max-h-48 overflow-y-auto rounded-md border p-3 space-y-1.5">
          {forums.map((forum) => (
            <label
              key={forum.id}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={selectedForums.includes(forum.id)}
                onChange={() => toggleForum(forum.id)}
                className="rounded border"
              />
              <span>{forum.name}</span>
            </label>
          ))}
          {forums.length === 0 && (
            <p className="text-xs text-muted-foreground">尚無看板資料</p>
          )}
        </div>
        <input type="hidden" name="targetForums" value="" />
      </div>

      {/* 啟用狀態 */}
      {isEditing && (
        <div className="flex items-center gap-2">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            defaultChecked={initialData?.isActive}
            value="true"
            className="rounded border"
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            啟用廣告
          </label>
        </div>
      )}

      {/* 按鈕 */}
      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? "處理中..." : isEditing ? "更新廣告" : "建立廣告"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border px-6 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          取消
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="ml-auto rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50 transition-colors"
          >
            刪除廣告
          </button>
        )}
      </div>
    </form>
  );
}
