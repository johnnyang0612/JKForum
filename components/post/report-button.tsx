"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";

const REPORT_TYPES = [
  { value: "PORNOGRAPHY", label: "色情/猥褻" },
  { value: "VIOLENCE", label: "暴力/血腥" },
  { value: "SPAM", label: "垃圾訊息/廣告" },
  { value: "HARASSMENT", label: "騷擾/霸凌" },
  { value: "MISINFORMATION", label: "假訊息" },
  { value: "OTHER", label: "其他" },
] as const;

export function ReportButton({
  targetType,
  targetId,
  size = "sm",
}: {
  targetType: "POST" | "REPLY" | "USER";
  targetId: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<typeof REPORT_TYPES[number]["value"]>("PORNOGRAPHY");
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function submit() {
    if (!reason.trim()) {
      setMsg({ ok: false, text: "請填寫原因" });
      return;
    }
    setMsg(null);
    start(async () => {
      const r = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, type, reason }),
      });
      const j = await r.json();
      if (r.ok) {
        setMsg({ ok: true, text: "已送出檢舉，感謝協助維護社群" });
        setReason("");
        setTimeout(() => setOpen(false), 1200);
      } else {
        setMsg({ ok: false, text: j?.error ?? "送出失敗" });
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 rounded text-muted-foreground hover:text-destructive ${
          size === "sm" ? "text-xs" : "text-sm"
        }`}
        title="檢舉"
      >
        <Flag className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
        <span>檢舉</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !pending && setOpen(false)}>
          <div className="w-full max-w-md space-y-3 rounded-lg border bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold">🚩 檢舉</h3>

            {msg && (
              <div className={`rounded border px-3 py-2 text-sm ${
                msg.ok ? "border-success/50 bg-success/10 text-success" : "border-danger/50 bg-danger/10 text-danger"
              }`}>{msg.text}</div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">違規類型</label>
              <select value={type} onChange={(e) => setType(e.target.value as typeof type)}
                className="w-full rounded border bg-background px-3 py-2 text-sm">
                {REPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">具體說明（必填）</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                rows={4} maxLength={500}
                placeholder="請詳述違規情況以利審核…"
                className="w-full rounded border bg-background px-3 py-2 text-sm" />
              <p className="mt-1 text-xs text-muted-foreground">{reason.length}/500</p>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} disabled={pending}
                className="rounded border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50">取消</button>
              <button onClick={submit} disabled={pending || !reason.trim()}
                className="rounded bg-destructive px-3 py-1.5 text-sm text-destructive-foreground hover:opacity-80 disabled:opacity-50">
                送出檢舉
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
