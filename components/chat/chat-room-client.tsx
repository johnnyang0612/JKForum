"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  ArrowLeft,
  CornerUpLeft,
  Image as ImageIcon,
  Send,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { EmojiPicker } from "./emoji-picker";
import { ImageLightbox } from "./image-lightbox";

type Attachment = {
  url: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number | null;
  height?: number | null;
};

type ReplyToInfo = {
  id: string;
  content: string;
  messageType: string;
  isDeleted: boolean;
  sender: { id: string; username: string; displayName: string };
} | null;

type ChatMsg = {
  id: string;
  content: string;
  messageType: "TEXT" | "IMAGE" | "STICKER" | "SYSTEM";
  attachments: Attachment[];
  replyTo: ReplyToInfo;
  isDeleted: boolean;
  editedAt: string | null;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    userGroup: string;
    profile: { avatarUrl: string | null } | null;
  };
};

const POLL_INTERVAL = 2500;
const RECALL_WINDOW_MS = 5 * 60_000;

function sameMinute(a: string, b: string) {
  return a.slice(0, 16) === b.slice(0, 16);
}

function formatHM(iso: string) {
  return new Date(iso).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFull(iso: string) {
  return new Date(iso).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function excerpt(content: string, len = 60) {
  const c = content.replace(/\s+/g, " ").trim();
  return c.length > len ? c.slice(0, len) + "…" : c;
}

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
  const [pendingImage, setPendingImage] = useState<{
    file: File;
    preview: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMsg | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [unreadWhileAway, setUnreadWhileAway] = useState(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const lastFetchRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const visibilityRef = useRef<"visible" | "hidden">(
    typeof document !== "undefined"
      ? (document.visibilityState as "visible" | "hidden")
      : "visible"
  );
  const isAtBottomRef = useRef(true);

  // 拉取訊息（初始 + 輪詢）
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
              const map = new Map(prev.map((m) => [m.id, m]));
              for (const m of json.messages as ChatMsg[]) map.set(m.id, m);
              return Array.from(map.values()).sort(
                (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
              );
            });
            lastFetchRef.current =
              json.messages[json.messages.length - 1].createdAt;

            // 視窗不在前台 → 累計未讀
            if (visibilityRef.current === "hidden") {
              const incoming = (json.messages as ChatMsg[]).filter(
                (m) => m.sender.id !== session?.user?.id
              );
              if (incoming.length > 0) {
                setUnreadWhileAway((c) => c + incoming.length);
              }
            }
          } else if (lastFetchRef.current === null) {
            lastFetchRef.current =
              json.serverTime ?? new Date().toISOString();
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
  }, [roomSlug, session?.user?.id]);

  // 視窗顯示狀態
  useEffect(() => {
    function onVis() {
      const v = document.visibilityState as "visible" | "hidden";
      visibilityRef.current = v;
      if (v === "visible") {
        setUnreadWhileAway(0);
        // 通知 server 已讀
        fetch(`/api/chat/${roomSlug}`).catch(() => null);
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [roomSlug]);

  // 標題顯示未讀
  useEffect(() => {
    const base = `# ${roomName} | 即時聊天室`;
    document.title =
      unreadWhileAway > 0 ? `(${unreadWhileAway}) ${base}` : base;
    return () => {
      document.title = base;
    };
  }, [unreadWhileAway, roomName]);

  // 滾動：判斷是否在底部
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distanceFromBottom < 80;
    setShowScrollBtn(distanceFromBottom > 200);
  }, []);

  // 新訊息：在底部才自動捲到底
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

  function scrollToBottom() {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }

  // 圖片選擇
  function pickImage() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)) {
      toast.error("僅支援 JPEG / PNG / WebP / GIF");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("圖片不可超過 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage({ file: f, preview: String(reader.result) });
    };
    reader.readAsDataURL(f);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (sending || uploading) return;
    if (!session?.user) {
      toast.error("請先登入");
      return;
    }
    const text = input.trim();
    if (!text && !pendingImage) return;

    setSending(true);
    try {
      let attachments: Attachment[] = [];

      // 1. 先上傳圖片（若有）
      if (pendingImage) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", pendingImage.file);
        const upRes = await fetch(`/api/chat/${roomSlug}/upload`, {
          method: "POST",
          body: fd,
        });
        const upJson = await upRes.json();
        setUploading(false);
        if (!upJson.success) {
          toast.error(upJson.error || "圖片上傳失敗");
          return;
        }
        attachments = [
          {
            url: upJson.data.url,
            fileName: upJson.data.fileName,
            mimeType: upJson.data.mimeType,
            fileSize: upJson.data.fileSize,
          },
        ];
      }

      // 2. 發送訊息
      const res = await fetch(`/api/chat/${roomSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          attachments,
          replyToId: replyTo?.id ?? null,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error);
        return;
      }
      setInput("");
      setPendingImage(null);
      setReplyTo(null);
      // 強制捲到底
      isAtBottomRef.current = true;
    } finally {
      setSending(false);
      setUploading(false);
    }
  }

  async function deleteMsg(id: string) {
    if (!confirm("撤回這則訊息？")) return;
    const res = await fetch(`/api/chat/${roomSlug}/${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.success) {
      setMessages((p) =>
        p.map((m) => (m.id === id ? { ...m, isDeleted: true } : m))
      );
      toast.success("已撤回");
    } else toast.error(json.error || "撤回失敗");
  }

  function pickReply(m: ChatMsg) {
    setReplyTo(m);
    inputRef.current?.focus();
  }

  function insertEmoji(emoji: string) {
    const el = inputRef.current;
    if (!el) {
      setInput((v) => v + emoji);
      return;
    }
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    const next = input.slice(0, start) + emoji + input.slice(end);
    setInput(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  }

  // 訊息分組（同分鐘 + 同作者 → 不重複顯示頭/時間）
  const grouped = useMemo(() => {
    return messages.map((m, i) => {
      const prev = messages[i - 1];
      const continued =
        prev &&
        prev.sender.id === m.sender.id &&
        sameMinute(prev.createdAt, m.createdAt) &&
        !m.replyTo;
      return { msg: m, continued };
    });
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col rounded-xl border bg-card sm:h-[calc(100vh-12rem)]">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Link
          href="/chat"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
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
        <span className="text-xs text-muted-foreground">
          {messages.length} 則
        </span>
      </header>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="relative flex-1 space-y-2 overflow-y-auto px-4 py-3"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            還沒人說話，搶頭香吧！
          </div>
        ) : (
          grouped.map(({ msg: m, continued }) => {
            const isMe = m.sender.id === session?.user?.id;
            const ageMs = Date.now() - new Date(m.createdAt).getTime();
            const canRecall = isMe && !m.isDeleted && ageMs < RECALL_WINDOW_MS;

            return (
              <div key={m.id} className="group flex items-start gap-2">
                {/* 頭像欄位 — 連續訊息留空保持對齊 */}
                <div className="w-8 flex-none">
                  {!continued && (
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {m.sender.profile?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.sender.profile.avatarUrl}
                          alt={m.sender.displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (m.sender.displayName?.[0] ?? m.sender.username[0])
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {!continued && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium">
                        {m.sender.displayName ?? m.sender.username}
                      </span>
                      <span
                        className="text-[10px] text-muted-foreground"
                        title={formatFull(m.createdAt)}
                      >
                        {formatHM(m.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* 引用訊息 */}
                  {m.replyTo && !m.isDeleted && (
                    <div className="my-1 max-w-[80%] rounded-md border-l-2 border-primary/60 bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                      <span className="font-medium text-primary">
                        {m.replyTo.sender.displayName ??
                          m.replyTo.sender.username}
                      </span>
                      <span className="mx-1">：</span>
                      {m.replyTo.isDeleted ? (
                        <span className="italic">訊息已撤回</span>
                      ) : m.replyTo.messageType === "IMAGE" ? (
                        "[圖片]"
                      ) : (
                        excerpt(m.replyTo.content, 60)
                      )}
                    </div>
                  )}

                  {/* 訊息本體 */}
                  {m.isDeleted ? (
                    <p className="text-sm italic text-muted-foreground">
                      訊息已撤回
                    </p>
                  ) : (
                    <>
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="my-1 flex flex-wrap gap-2">
                          {m.attachments.map((a, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setLightbox(a.url)}
                              className="overflow-hidden rounded-lg border bg-muted hover:opacity-90"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={a.url}
                                alt={a.fileName ?? "image"}
                                className="max-h-64 max-w-[240px] object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                      {m.content && (
                        <p
                          className="whitespace-pre-wrap break-words text-sm"
                          title={formatFull(m.createdAt)}
                        >
                          {m.content}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* hover 操作 */}
                {!m.isDeleted && (
                  <div className="flex flex-none items-start gap-1 pt-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => pickReply(m)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-primary"
                      aria-label="回覆"
                      title="回覆"
                    >
                      <CornerUpLeft className="h-4 w-4" />
                    </button>
                    {canRecall && (
                      <button
                        type="button"
                        onClick={() => deleteMsg(m.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-rose-400"
                        aria-label="撤回"
                        title="撤回（5 分鐘內）"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 滾動到底部 */}
      {showScrollBtn && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90"
          aria-label="滾動到底部"
        >
          <ArrowDown className="h-4 w-4" />
          {unreadWhileAway > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unreadWhileAway}
            </span>
          )}
        </button>
      )}

      {/* 引用提示 */}
      {replyTo && (
        <div className="flex items-center gap-2 border-t bg-muted/40 px-4 py-2 text-xs">
          <CornerUpLeft className="h-3 w-3 text-primary" />
          <span className="text-muted-foreground">回覆</span>
          <span className="font-medium text-primary">
            {replyTo.sender.displayName ?? replyTo.sender.username}
          </span>
          <span className="flex-1 truncate text-muted-foreground">
            {replyTo.messageType === "IMAGE" && (!replyTo.content || replyTo.content.length === 0)
              ? "[圖片]"
              : excerpt(replyTo.content, 60)}
          </span>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="text-muted-foreground hover:text-rose-400"
            aria-label="取消回覆"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* 圖片預覽 */}
      {pendingImage && (
        <div className="flex items-center gap-2 border-t bg-muted/40 px-4 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pendingImage.preview}
            alt="預覽"
            className="h-12 w-12 rounded object-cover"
          />
          <span className="flex-1 truncate text-xs text-muted-foreground">
            {pendingImage.file.name}
          </span>
          <button
            type="button"
            onClick={() => setPendingImage(null)}
            className="text-muted-foreground hover:text-rose-400"
            aria-label="移除圖片"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={send} className="flex items-center gap-2 border-t p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={onFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={pickImage}
          disabled={!session?.user || sending || uploading}
          className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border bg-background hover:bg-muted disabled:opacity-40"
          aria-label="上傳圖片"
        >
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        </button>

        <EmojiPicker onPick={insertEmoji} />

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            session?.user
              ? pendingImage
                ? "新增說明文字（可省略）..."
                : "說點什麼..."
              : "請先登入後發言"
          }
          disabled={!session?.user || sending}
          maxLength={2000}
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button
          type="submit"
          disabled={
            (!input.trim() && !pendingImage) ||
            sending ||
            uploading ||
            !session?.user
          }
        >
          {uploading ? (
            <span className="text-xs">上傳中…</span>
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      <ImageLightbox url={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
