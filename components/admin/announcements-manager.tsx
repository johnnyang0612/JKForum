"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pin, PinOff } from "lucide-react";

type Ann = {
  id: string;
  title: string;
  body: string;
  severity: string;
  isPinned: boolean;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
};

const SEVERITY_LABEL: Record<string, string> = {
  INFO: "ℹ️ 一般",
  WARNING: "⚠️ 警示",
  CRITICAL: "🚨 嚴重",
};

export function AnnouncementsManager({ initial }: { initial: Ann[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [showNew, setShowNew] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  function togglePin(a: Ann) {
    start(async () => {
      const r = await fetch(`/api/admin/announcements/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !a.isPinned }),
      });
      if (r.ok) router.refresh();
    });
  }

  function del(a: Ann) {
    if (!confirm(`確定刪除「${a.title}」？`)) return;
    start(async () => {
      const r = await fetch(`/api/admin/announcements/${a.id}`, { method: "DELETE" });
      if (r.ok) {
        setList((l) => l.filter((x) => x.id !== a.id));
        router.refresh();
      } else setError("刪除失敗");
    });
  }

  return (
    <div className="space-y-3">
      {error && <div className="rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger">{error}</div>}

      {!showNew ? (
        <button onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1 rounded-md border border-dashed px-3 py-2 text-sm hover:bg-muted">
          <Plus className="h-4 w-4" /> 新增公告
        </button>
      ) : (
        <NewAnnouncementForm
          onCancel={() => setShowNew(false)}
          onCreated={(a) => { setList((l) => [a, ...l]); setShowNew(false); router.refresh(); }}
        />
      )}

      <div className="space-y-2">
        {list.length === 0 && (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            尚無公告
          </p>
        )}
        {list.map((a) => (
          <div key={a.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {a.isPinned && <span className="rounded bg-warning/20 px-1.5 py-0.5 text-warning">置頂</span>}
                  <span>{SEVERITY_LABEL[a.severity]}</span>
                  <span>· {new Date(a.createdAt).toLocaleString("zh-TW")}</span>
                  {a.startAt && <span>· 起：{new Date(a.startAt).toLocaleDateString("zh-TW")}</span>}
                  {a.endAt && <span>· 訖：{new Date(a.endAt).toLocaleDateString("zh-TW")}</span>}
                </div>
                <h3 className="font-bold">{a.title}</h3>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{a.body}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => togglePin(a)} disabled={pending}
                  className="rounded p-1.5 hover:bg-muted" title={a.isPinned ? "取消置頂" : "置頂"}>
                  {a.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </button>
                <button onClick={() => del(a)} disabled={pending}
                  className="rounded p-1.5 text-destructive hover:bg-destructive/10" title="刪除">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewAnnouncementForm({
  onCancel, onCreated,
}: {
  onCancel: () => void;
  onCreated: (a: Ann) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState("INFO");
  const [isPinned, setIsPinned] = useState(false);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  function submit() {
    setError("");
    if (!title.trim() || !body.trim()) {
      setError("標題與內容為必填");
      return;
    }
    start(async () => {
      const r = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, body, severity, isPinned,
          startAt: startAt || null,
          endAt: endAt || null,
        }),
      });
      const j = await r.json();
      if (r.ok) onCreated(j.data);
      else setError(j?.error ?? "建立失敗");
    });
  }

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      {error && <div className="text-sm text-danger">{error}</div>}
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="標題（最多 200 字）"
        maxLength={200} className="w-full rounded border bg-background px-3 py-2" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="公告內容…" rows={4}
        className="w-full rounded border bg-background px-3 py-2 text-sm" />
      <div className="flex flex-wrap gap-3">
        <select value={severity} onChange={(e) => setSeverity(e.target.value)}
          className="rounded border bg-background px-2 py-1 text-sm">
          <option value="INFO">ℹ️ 一般</option>
          <option value="WARNING">⚠️ 警示</option>
          <option value="CRITICAL">🚨 嚴重</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
          置頂
        </label>
        <div className="flex items-center gap-1 text-xs">
          起：<input type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)}
            className="rounded border bg-background px-2 py-1" />
        </div>
        <div className="flex items-center gap-1 text-xs">
          訖：<input type="date" value={endAt} onChange={(e) => setEndAt(e.target.value)}
            className="rounded border bg-background px-2 py-1" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={submit} disabled={pending}
          className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-80 disabled:opacity-50">建立</button>
        <button onClick={onCancel} className="rounded border px-3 py-1.5 text-sm hover:bg-muted">取消</button>
      </div>
    </div>
  );
}
