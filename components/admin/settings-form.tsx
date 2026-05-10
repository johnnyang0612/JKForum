"use client";

import { useState, useTransition } from "react";

export function SettingsForm({ initial }: { initial: Record<string, unknown> }) {
  const [state, setState] = useState({
    name: String(initial["site.name"] ?? "JKForum"),
    description: String(initial["site.description"] ?? "綜合型社群論壇平台"),
    logoUrl: String(initial["site.logoUrl"] ?? ""),
    faviconUrl: String(initial["site.faviconUrl"] ?? ""),
    seoTitle: String(initial["site.seoTitle"] ?? ""),
    seoDescription: String(initial["site.seoDescription"] ?? ""),
    contactEmail: String(initial["site.contactEmail"] ?? ""),
    maintenanceMode: Boolean(initial["site.maintenanceMode"]),
    maintenanceMessage: String(initial["site.maintenanceMessage"] ?? "系統維護中，預計幾分鐘後恢復。"),
  });
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function set<K extends keyof typeof state>(key: K, val: typeof state[K]) {
    setState((s) => ({ ...s, [key]: val }));
  }

  function save() {
    setMsg(null);
    start(async () => {
      const r = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      if (r.ok) setMsg({ ok: true, text: "已儲存" });
      else {
        const j = await r.json().catch(() => ({}));
        setMsg({ ok: false, text: j?.error ?? "儲存失敗" });
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      {msg && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${
          msg.ok ? "border-success/50 bg-success/10 text-success" : "border-danger/50 bg-danger/10 text-danger"
        }`}>{msg.text}</div>
      )}

      <Field label="站名">
        <input value={state.name} onChange={(e) => set("name", e.target.value)} className={cls()} />
      </Field>
      <Field label="站台描述">
        <textarea value={state.description} onChange={(e) => set("description", e.target.value)} rows={2} className={cls()} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Logo URL">
          <input value={state.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} className={cls()} />
        </Field>
        <Field label="Favicon URL">
          <input value={state.faviconUrl} onChange={(e) => set("faviconUrl", e.target.value)} className={cls()} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SEO Title">
          <input value={state.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className={cls()} />
        </Field>
        <Field label="SEO Description">
          <input value={state.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} className={cls()} />
        </Field>
      </div>
      <Field label="聯絡 Email">
        <input value={state.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className={cls()} />
      </Field>

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">🚧 維護模式</p>
            <p className="text-xs text-muted-foreground">開啟後前台僅管理員可進入。</p>
          </div>
          <button
            type="button"
            onClick={() => set("maintenanceMode", !state.maintenanceMode)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
              state.maintenanceMode ? "bg-danger" : "bg-muted"
            }`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              state.maintenanceMode ? "translate-x-5" : "translate-x-0"
            }`} />
          </button>
        </div>
        <Field label="維護訊息">
          <textarea value={state.maintenanceMessage} onChange={(e) => set("maintenanceMessage", e.target.value)} rows={2} className={cls()} />
        </Field>
      </div>

      <button type="button" onClick={save} disabled={pending}
        className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-80 disabled:opacity-50">
        儲存設定
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function cls() {
  return "w-full rounded-md border bg-background px-3 py-2 text-sm";
}
