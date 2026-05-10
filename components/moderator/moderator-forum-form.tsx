"use client";

import { useState, useTransition } from "react";

type Initial = {
  rules: string;
  isLocked: boolean;
  maxPinnedPosts: number;
  advancedFiltersJson: string;
  themeCategoriesJson: string;
  forceThemeCategory: boolean;
};

export function ModeratorForumForm({
  forumId,
  initial,
}: {
  forumId: string;
  initial: Initial;
}) {
  const [data, setData] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function set<K extends keyof Initial>(k: K, v: Initial[K]) {
    setData((d) => ({ ...d, [k]: v }));
  }

  function save() {
    setMsg(null);
    // 預驗 advancedFiltersJson 為合法 JSON
    try {
      const parsed = JSON.parse(data.advancedFiltersJson || "[]");
      if (!Array.isArray(parsed)) throw new Error("須為 array");
    } catch (e) {
      setMsg({ ok: false, text: `advancedFilters JSON 格式錯誤：${(e as Error).message}` });
      return;
    }
    start(async () => {
      const r = await fetch(`/api/moderator/forums/${forumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules: data.rules,
          isLocked: data.isLocked,
          maxPinnedPosts: data.maxPinnedPosts,
          advancedFiltersRaw: data.advancedFiltersJson,
          themeCategoriesRaw: data.themeCategoriesJson,
          forceThemeCategory: data.forceThemeCategory,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) setMsg({ ok: true, text: "已儲存" });
      else setMsg({ ok: false, text: j?.error ?? "儲存失敗" });
    });
  }

  return (
    <div className="space-y-4 text-sm">
      {msg && (
        <div className={`rounded border px-3 py-2 ${
          msg.ok ? "border-success/50 bg-success/10 text-success" : "border-danger/50 bg-danger/10 text-danger"
        }`}>{msg.text}</div>
      )}

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="font-bold">📜 版規</h3>
        <textarea
          value={data.rules}
          onChange={(e) => set("rules", e.target.value)}
          rows={6}
          maxLength={5000}
          placeholder="編輯本版規則…"
          className="w-full rounded-md border bg-background px-3 py-2 text-base sm:text-sm"
        />
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="font-bold">🔒 鎖定/置頂</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.isLocked}
            onChange={(e) => set("isLocked", e.target.checked)}
            className="tap-target"
          />
          <span>鎖定本版（禁止新發文 / 留言）</span>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted-foreground">置頂上限（0–10）</span>
          <input
            type="number"
            min="0"
            max="10"
            value={data.maxPinnedPosts}
            onChange={(e) => set("maxPinnedPosts", Number(e.target.value))}
            className="w-20 rounded-md border bg-background px-3 py-2"
          />
        </label>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="font-bold">🏷️ 主題分類（如：技術 / 新聞 / 心得）</h3>
        <input
          value={data.themeCategoriesJson}
          onChange={(e) => set("themeCategoriesJson", e.target.value)}
          placeholder="例：技術, 新聞, 心得"
          className="w-full rounded-md border bg-background px-3 py-2 text-base sm:text-sm"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.forceThemeCategory}
            onChange={(e) => set("forceThemeCategory", e.target.checked)}
            className="tap-target"
          />
          <span>發文時強制要選主題</span>
        </label>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="font-bold">🔍 進階搜尋 Filter（JSON）</h3>
        <p className="text-xs text-muted-foreground">
          每個版區可自訂篩選條件（select / multiselect / range）。
          格式：<code>{`[{"key":"bodyType","label":"外型","type":"multiselect","options":["纖細","豐滿"]}]`}</code>
        </p>
        <textarea
          value={data.advancedFiltersJson}
          onChange={(e) => set("advancedFiltersJson", e.target.value)}
          rows={10}
          className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
        />
      </div>

      <div className="sticky bottom-0 -mx-3 flex gap-2 border-t bg-background/95 px-3 py-3 backdrop-blur safe-area-pb sm:relative sm:mx-0 sm:border-t-0 sm:bg-transparent sm:py-0 sm:backdrop-blur-none">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex-1 sm:flex-none min-h-[44px] rounded bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-80 disabled:opacity-50"
        >
          儲存版務設定
        </button>
      </div>
    </div>
  );
}
