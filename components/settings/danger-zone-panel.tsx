"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";

export function DangerZonePanel({
  pendingDeletion,
}: {
  pendingDeletion: { scheduledAt: string } | null;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function logoutEverywhere() {
    if (!confirm("確定登出所有裝置？目前 session 也會立刻失效。")) return;
    setMsg(null);
    start(async () => {
      const r = await fetch("/api/users/me/sessions", { method: "DELETE" });
      if (r.ok) {
        // 清完後直接登出本地
        await signOut({ callbackUrl: "/login" });
      } else {
        setMsg({ ok: false, text: "登出全裝置失敗" });
      }
    });
  }

  function requestDelete() {
    const reason = prompt("可選擇填寫離站原因（送出後 30 天可取消）：");
    if (reason === null) return; // 取消對話框
    if (!confirm("確定提交帳號刪除申請？30 天後系統會永久刪除你的帳號與內容；30 天內可取消。")) return;
    setMsg(null);
    start(async () => {
      const r = await fetch("/api/users/me/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (r.ok) {
        const j = await r.json();
        setMsg({ ok: true, text: `已提交刪除申請，將於 ${new Date(j.scheduledAt).toLocaleString("zh-TW")} 執行` });
        // refresh
        setTimeout(() => location.reload(), 1500);
      } else {
        const j = await r.json().catch(() => ({}));
        setMsg({ ok: false, text: j?.error ?? "申請失敗" });
      }
    });
  }

  function cancelDelete() {
    if (!confirm("取消刪除申請？")) return;
    start(async () => {
      const r = await fetch("/api/users/me/delete", { method: "DELETE" });
      if (r.ok) {
        setMsg({ ok: true, text: "已取消刪除申請" });
        setTimeout(() => location.reload(), 1000);
      } else {
        setMsg({ ok: false, text: "取消失敗" });
      }
    });
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`rounded border px-3 py-2 text-sm ${
          msg.ok ? "border-success/50 bg-success/10 text-success" : "border-danger/50 bg-danger/10 text-danger"
        }`}>{msg.text}</div>
      )}

      <div className="rounded-lg border bg-card p-4 space-y-2">
        <h3 className="font-bold">🚪 登出所有裝置</h3>
        <p className="text-sm text-muted-foreground">
          擔心帳號被盜時使用：強制下線所有 session，包括目前這個。
        </p>
        <button onClick={logoutEverywhere} disabled={pending}
          className="rounded border border-warning/50 bg-warning/10 px-4 py-2.5 text-sm min-h-[44px] text-warning hover:bg-warning/20 disabled:opacity-50">
          登出所有裝置
        </button>
      </div>

      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-2">
        <h3 className="font-bold text-destructive">🗑️ 刪除帳號</h3>
        {pendingDeletion ? (
          <>
            <p className="text-sm">
              你已提交刪除申請，預計於 <strong>{new Date(pendingDeletion.scheduledAt).toLocaleString("zh-TW")}</strong> 永久刪除。
              在此之前可隨時取消。
            </p>
            <button onClick={cancelDelete} disabled={pending}
              className="rounded border px-4 py-2.5 text-sm min-h-[44px] hover:bg-muted disabled:opacity-50">
              取消刪除申請
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              提出申請後有 30 天冷靜期。期間可取消；30 天到期後帳號、發文、留言、訊息將被永久刪除（依 GDPR / 個資法）。
            </p>
            <button onClick={requestDelete} disabled={pending}
              className="rounded bg-destructive px-4 py-2.5 text-sm min-h-[44px] text-destructive-foreground hover:opacity-80 disabled:opacity-50">
              我了解，提交刪除申請
            </button>
          </>
        )}
      </div>
    </div>
  );
}
