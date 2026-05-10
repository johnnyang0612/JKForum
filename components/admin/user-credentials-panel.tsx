"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UserCredentialsPanel({ userId, email }: { userId: string; email: string }) {
  const [newEmail, setNewEmail] = useState(email);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function changeEmail() {
    setMsg(null);
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(newEmail)) {
      setMsg({ type: "error", text: "Email 格式錯誤" });
      return;
    }
    if (newEmail === email) {
      setMsg({ type: "error", text: "Email 沒有變更" });
      return;
    }
    if (!confirm(`確定把使用者 email 改為 ${newEmail}？`)) return;
    start(async () => {
      const r = await fetch(`/api/admin/users/${userId}/email`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      const j = await r.json();
      if (r.ok) setMsg({ type: "success", text: "Email 已更新" });
      else setMsg({ type: "error", text: j?.error ?? "更新失敗" });
    });
  }

  function resetPassword() {
    if (!confirm("產生臨時密碼並強制下次登入要改？使用者下次登入會被要求設新密碼。")) return;
    start(async () => {
      const r = await fetch(`/api/admin/users/${userId}/reset-password`, { method: "POST" });
      const j = await r.json();
      if (r.ok) {
        setMsg({ type: "success", text: `臨時密碼：${j.tempPassword} （請通知使用者，僅顯示一次）` });
      } else {
        setMsg({ type: "error", text: j?.error ?? "重設失敗" });
      }
    });
  }

  return (
    <div className="space-y-3">
      {msg && (
        <div className={`rounded border px-3 py-2 text-sm ${
          msg.type === "success"
            ? "border-success/50 bg-success/10 text-success"
            : "border-danger/50 bg-danger/10 text-danger"
        }`}>{msg.text}</div>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[200px]">
          <Input
            label="Email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
        </div>
        <Button type="button" onClick={changeEmail} loading={pending} variant="outline">
          更新 Email
        </Button>
      </div>
      <div>
        <Button type="button" onClick={resetPassword} loading={pending} variant="outline">
          重設密碼（產生臨時密碼）
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">
          重設後系統會產生一組 12 字元臨時密碼，使用者用該密碼登入後**強制改密碼**。
        </p>
      </div>
    </div>
  );
}
