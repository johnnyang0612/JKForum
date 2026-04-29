"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send } from "lucide-react";

export function PushBroadcastForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [image, setImage] = useState("");
  const [target, setTarget] = useState<"all" | "user">("all");
  const [userId, setUserId] = useState("");
  const [pending, start] = useTransition();
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number; expired: number } | null>(null);

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("請輸入標題");
      return;
    }
    if (target === "user" && !userId.trim()) {
      toast.error("請輸入目標用戶 ID");
      return;
    }
    start(async () => {
      const res = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          url,
          image: image || undefined,
          target,
          userId: target === "user" ? userId : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`✅ 送出 ${json.sent} 則（失敗 ${json.failed}）`);
        setLastResult({ sent: json.sent, failed: json.failed, expired: json.expired });
      } else {
        toast.error(json.error);
      }
    });
  }

  return (
    <form onSubmit={send} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="標題"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          required
          placeholder="例：新版上線通知"
        />
        <Input
          label="連結"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="/"
        />
      </div>

      <Textarea
        label="內容"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={300}
        rows={3}
        placeholder="通知內文（最多 300 字）"
      />

      <Input
        label="圖片網址（選填）"
        value={image}
        onChange={(e) => setImage(e.target.value)}
        placeholder="https://..."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="col-span-1">
          <label className="mb-1 block text-sm font-medium">目標</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as "all" | "user")}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="all">廣播給全部</option>
            <option value="user">特定用戶</option>
          </select>
        </div>
        {target === "user" && (
          <Input
            label="用戶 ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="cuid..."
            className="sm:col-span-2"
          />
        )}
      </div>

      <Button type="submit" disabled={pending} className="gap-2">
        <Send className="h-4 w-4" />
        {pending ? "送出中..." : "發送推播"}
      </Button>

      {lastResult && (
        <div className="rounded-lg border bg-emerald-500/5 p-3 text-sm">
          <b>上次送出結果：</b> 成功 {lastResult.sent} · 失敗 {lastResult.failed} · 已清過期 {lastResult.expired}
        </div>
      )}
    </form>
  );
}
