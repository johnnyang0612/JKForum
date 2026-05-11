"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function BusinessRatingReply({
  ratingId,
  initialReply,
  initialRepliedAt,
}: {
  ratingId: string;
  initialReply: string | null;
  initialRepliedAt: string | null;
}) {
  const router = useRouter();
  const [reply, setReply] = useState(initialReply ?? "");
  const [editing, setEditing] = useState(!initialReply);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function save() {
    setMsg(null);
    if (!reply.trim()) {
      setMsg({ ok: false, text: "回覆不可為空" });
      return;
    }
    start(async () => {
      const r = await fetch(`/api/business/ratings/${ratingId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: reply.trim() }),
      });
      const j = await r.json();
      if (r.ok) {
        setMsg({ ok: true, text: "已回覆" });
        setEditing(false);
        router.refresh();
      } else {
        setMsg({ ok: false, text: j?.error ?? "送出失敗" });
      }
    });
  }

  function del() {
    if (!confirm("刪除這則回覆？")) return;
    start(async () => {
      const r = await fetch(`/api/business/ratings/${ratingId}/reply`, { method: "DELETE" });
      if (r.ok) {
        setReply("");
        setEditing(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-2 rounded border-l-2 border-primary bg-primary/5 p-2 text-xs space-y-1">
      <p className="font-bold text-primary flex items-center gap-1">
        🏪 業者回覆
        {initialRepliedAt && !editing && (
          <span className="ml-1 font-normal text-muted-foreground">
            · {new Date(initialRepliedAt).toLocaleDateString("zh-TW")}
          </span>
        )}
      </p>
      {msg && (
        <div className={msg.ok ? "text-success" : "text-danger"}>{msg.text}</div>
      )}
      {editing ? (
        <>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="專業、禮貌地回覆消費者"
            className="w-full rounded border bg-background px-2 py-1.5 text-xs"
          />
          <div className="flex justify-end gap-1">
            {initialReply && (
              <button onClick={() => { setReply(initialReply); setEditing(false); }}
                className="rounded border px-2 py-1 hover:bg-muted">取消</button>
            )}
            <button onClick={save} disabled={pending}
              className="rounded bg-primary px-3 py-1 text-primary-foreground disabled:opacity-50">
              {pending ? "送出中…" : (initialReply ? "更新回覆" : "送出回覆")}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="whitespace-pre-wrap">{reply}</p>
          <div className="flex justify-end gap-1 pt-1">
            <button onClick={() => setEditing(true)} className="rounded border px-2 py-1 hover:bg-muted">編輯</button>
            <button onClick={del} disabled={pending}
              className="rounded border border-destructive/40 px-2 py-1 text-destructive hover:bg-destructive/10 disabled:opacity-50">
              刪除
            </button>
          </div>
        </>
      )}
    </div>
  );
}
