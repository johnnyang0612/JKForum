"use client";

import { useState } from "react";
import { PushButton } from "@/components/push/push-button";

const NOTIFICATION_SETTINGS = [
  { key: "reply", label: "回覆通知", description: "有人回覆你的文章時通知你" },
  { key: "like", label: "按讚通知", description: "有人讚你的內容時通知你" },
  { key: "follow", label: "追蹤通知", description: "有人追蹤你時通知你" },
  { key: "mention", label: "提及通知", description: "有人在文章中提及你時通知你" },
  { key: "system", label: "系統通知", description: "系統公告與重要訊息" },
];

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<Record<string, boolean>>({
    reply: true,
    like: true,
    follow: true,
    mention: true,
    system: true,
  });

  function toggle(key: string) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">通知設定</h2>
        <p className="text-sm text-muted-foreground">管理你接收通知的偏好</p>
      </div>

      {/* PWA Push */}
      <section className="space-y-3 rounded-xl border bg-card p-4">
        <div>
          <h3 className="font-bold">📱 推播通知</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            啟用後即使關閉瀏覽器也能收到重要通知（需要 Chrome / Edge / Firefox / Safari iOS 16.4+）
          </p>
        </div>
        <PushButton />
      </section>

      <div className="space-y-4">
        {NOTIFICATION_SETTINGS.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between rounded-lg border bg-card p-4"
          >
            <div>
              <p className="font-medium text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <button
              type="button"
              onClick={() => toggle(item.key)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                settings[item.key] ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  settings[item.key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        通知偏好功能即將上線，目前會接收所有通知。
      </p>
    </div>
  );
}
