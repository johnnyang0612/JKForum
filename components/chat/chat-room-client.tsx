"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

type ChatMsg = {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    userGroup: string;
    profile: { avatarUrl: string | null } | null;
  };
};

const POLL_INTERVAL = 2000;

export function ChatRoomClient({
  roomSlug,
  roomName,
  rating,
}: {
  roomSlug: string;
  roomName: string;
  rating: string;
}) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const lastFetchRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 初始載入 + 輪詢
  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const url = lastFetchRef.current
          ? `/api/chat/${roomSlug}?since=${encodeURIComponent(lastFetchRef.current)}`
          : `/api/chat/${roomSlug}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success && mounted) {
          if (json.messages.length > 0) {
            setMessages((prev) => {
              const seen = new Set(prev.map((m) => m.id));
              const fresh = json.messages.filter((m: ChatMsg) => !seen.has(m.id));
              return [...prev, ...fresh];
            });
            lastFetchRef.current = json.messages[json.messages.length - 1].createdAt;
          } else if (lastFetchRef.current === null) {
            // 第一次拉空也設定 timestamp 開始輪詢新訊息
            lastFetchRef.current = json.serverTime ?? new Date().toISOString();
          }
        }
      } catch {}
      if (mounted) timer = setTimeout(poll, POLL_INTERVAL);
    }
    poll();
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [roomSlug]);

  // 新訊息自動捲到底
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    if (!session?.user) {
      toast.error("請先登入");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${roomSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim() }),
      });
      const json = await res.json();
      if (!json.success) toast.error(json.error);
      else setInput("");
    } finally {
      setSending(false);
    }
  }

  async function deleteMsg(id: string) {
    if (!confirm("刪除這則訊息？")) return;
    const res = await fetch(`/api/chat/${roomSlug}/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      setMessages((p) => p.filter((m) => m.id !== id));
      toast.success("已刪除");
    } else toast.error(json.error);
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col rounded-xl border bg-card">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Link href="/chat" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          所有聊天室
        </Link>
        <h1 className="font-bold">
          # {roomName}
          {rating === "R18" && (
            <span className="ml-2 rounded bg-rose-500/10 px-1.5 py-0.5 text-xs text-rose-400">
              18+
            </span>
          )}
        </h1>
        <span className="text-xs text-muted-foreground">{messages.length} 則</span>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            還沒人說話，搶頭香吧！
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="group flex items-start gap-2">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {m.sender.displayName?.[0] ?? m.sender.username[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">
                    {m.sender.displayName ?? m.sender.username}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(m.createdAt).toLocaleTimeString("zh-TW", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="break-words text-sm">{m.content}</p>
              </div>
              {(m.sender.id === session?.user?.id) && (
                <button
                  onClick={() => deleteMsg(m.id)}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="刪除"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-rose-400" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={send} className="flex gap-2 border-t p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={session?.user ? "說點什麼..." : "請先登入後發言"}
          disabled={!session?.user || sending}
          maxLength={500}
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button type="submit" disabled={!input.trim() || sending || !session?.user}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
