"use client";

import { useState, useTransition } from "react";

type Channel = "site" | "email" | "line" | "push";

type Prefs = Record<string, Partial<Record<Channel, boolean>>>;

const TYPES = [
  { key: "REPLY", label: "回覆通知", desc: "有人回覆你的文章 / 留言" },
  { key: "LIKE", label: "按讚通知", desc: "有人讚你的內容" },
  { key: "FOLLOW", label: "追蹤通知", desc: "有人追蹤你" },
  { key: "MENTION", label: "@ 提及", desc: "有人在文章中提及你" },
  { key: "SYSTEM", label: "系統通知", desc: "系統公告、KYC 結果" },
  { key: "REPORT_RESULT", label: "檢舉處理結果", desc: "你提交的檢舉處理進度" },
  { key: "LEVEL_UP", label: "升級通知", desc: "等級晉升、權限解鎖" },
  { key: "ACHIEVEMENT", label: "成就 / 勳章", desc: "完成任務、得到勳章" },
] as const;

const CHANNELS: Array<{ key: Channel; label: string; defaultOn: boolean }> = [
  { key: "site", label: "站內", defaultOn: true },
  { key: "email", label: "Email", defaultOn: false },
  { key: "line", label: "LINE", defaultOn: false },
  { key: "push", label: "推播", defaultOn: false },
];

export function NotificationPrefsForm({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function value(type: string, ch: Channel) {
    const v = prefs[type]?.[ch];
    if (v !== undefined) return v;
    if (ch === "site") return true;
    return false;
  }

  function set(type: string, ch: Channel, v: boolean) {
    setPrefs((p) => ({
      ...p,
      [type]: { ...p[type], [ch]: v },
    }));
  }

  function save() {
    setMsg(null);
    start(async () => {
      const r = await fetch("/api/users/me/notification-prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefs }),
      });
      if (r.ok) setMsg({ ok: true, text: "已儲存" });
      else {
        const j = await r.json().catch(() => ({}));
        setMsg({ ok: false, text: j?.error ?? "儲存失敗" });
      }
    });
  }

  return (
    <section className="space-y-3">
      {msg && (
        <div className={`rounded border px-3 py-2 text-sm ${
          msg.ok ? "border-success/50 bg-success/10 text-success" : "border-danger/50 bg-danger/10 text-danger"
        }`}>{msg.text}</div>
      )}

      {/* 桌面：表格；手機：折疊卡片 */}
      <div className="hidden md:block rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3 text-left">通知類型</th>
              {CHANNELS.map((c) => (
                <th key={c.key} className="p-3 text-center w-20">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TYPES.map((t) => (
              <tr key={t.key} className="border-b">
                <td className="p-3">
                  <p className="font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </td>
                {CHANNELS.map((c) => (
                  <td key={c.key} className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={value(t.key, c.key)}
                      onChange={(e) => set(t.key, c.key, e.target.checked)}
                      className="h-5 w-5"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 手機版卡片 */}
      <div className="md:hidden space-y-2">
        {TYPES.map((t) => (
          <div key={t.key} className="rounded-lg border bg-card p-3 space-y-2">
            <div>
              <p className="font-medium text-sm">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((c) => (
                <label key={c.key} className="flex items-center gap-1.5 rounded border bg-background px-2 py-1.5 text-xs min-h-[40px]">
                  <input
                    type="checkbox"
                    checked={value(t.key, c.key)}
                    onChange={(e) => set(t.key, c.key, e.target.checked)}
                    className="h-4 w-4"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 -mx-3 flex gap-2 border-t bg-background/95 px-3 py-3 backdrop-blur safe-area-pb sm:relative sm:mx-0 sm:border-t-0 sm:bg-transparent sm:py-0 sm:backdrop-blur-none">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex-1 sm:flex-none min-h-[44px] rounded bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-80 disabled:opacity-50"
        >
          {pending ? "儲存中…" : "儲存設定"}
        </button>
      </div>
    </section>
  );
}
