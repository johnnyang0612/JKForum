"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function NewBlogPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("標題與內容不可空");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, coverUrl, isPublic }),
      });
      const json = await res.json();
      if (!json.success) toast.error(json.error);
      else {
        toast.success("日誌發布成功");
        router.push(`/blog/${json.blog.id}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">✍️ 寫日誌</h1>
      <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-5">
        <div>
          <label className="mb-1 block text-sm font-medium">標題</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            className="w-full rounded-lg border bg-background px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">封面圖網址（選填）</label>
          <input
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border bg-background px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">內容（支援 HTML）</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            required
            className="w-full rounded-lg border bg-background px-3 py-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="isPublic"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <label htmlFor="isPublic" className="text-sm">公開（其他人可瀏覽）</label>
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "發布中..." : "發布日誌"}
        </Button>
      </form>
    </div>
  );
}
