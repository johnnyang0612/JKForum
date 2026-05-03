"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BlogEditor, type BlogEditorValue } from "@/components/blog/blog-editor";
import { StoreLinkPicker } from "@/components/blog/store-link-picker";
import { Save, Send } from "lucide-react";

const DRAFT_KEY = "jkf_blog_draft_v1";

export default function NewBlogPage() {
  const router = useRouter();
  const [v, setV] = useState<BlogEditorValue>({
    title: "", content: "", coverUrl: "", isPublic: true, hasVideo: false,
  });
  const [adId, setAdId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const draftLoaded = useRef(false);

  // 還原草稿
  useEffect(() => {
    if (draftLoaded.current) return;
    draftLoaded.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d?.title || d?.content) {
          if (confirm("發現未發布的草稿，要還原嗎？")) {
            setV(d.v); setAdId(d.adId ?? null); setRating(d.rating ?? 0);
          } else {
            localStorage.removeItem(DRAFT_KEY);
          }
        }
      }
    } catch {}
  }, []);

  // 自動存草稿（每次更新 5 秒後存）
  useEffect(() => {
    const t = setTimeout(() => {
      if (v.title || v.content) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ v, adId, rating }));
        setSavedAt(new Date());
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [v, adId, rating]);

  async function publish(asDraft = false) {
    if (!v.title.trim() || !v.content.trim()) return toast.error("標題與內容不可空");
    if (!asDraft && !adId) return toast.error("發布需綁定店家廣告（PRD 規範）");
    setBusy(true);
    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: v.title, content: v.content, coverUrl: v.coverUrl || null,
          isPublic: v.isPublic, hasVideo: v.hasVideo,
          status: asDraft ? "DRAFT" : "PUBLISHED",
          adId, rating: rating || null,
        }),
      });
      const j = await res.json();
      if (!j.success) toast.error(j.error);
      else {
        localStorage.removeItem(DRAFT_KEY);
        toast.success(asDraft ? "已存為草稿" : "日誌發布成功");
        router.push(asDraft ? "/blog" : `/blog/${j.blog.id}`);
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">✍️ 寫日誌</h1>
        {savedAt && (
          <span className="text-xs text-muted-foreground">
            <Save className="mr-1 inline h-3 w-3" />
            草稿已自動存於 {savedAt.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-4">
        <BlogEditor onChange={setV} initial={v} busy={busy} />
        <StoreLinkPicker adId={adId} rating={rating}
          onChange={(id, r) => { setAdId(id); setRating(r); }} />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => publish(true)} disabled={busy}>
          <Save className="h-4 w-4" /> 存草稿
        </Button>
        <Button onClick={() => publish(false)} disabled={busy}>
          <Send className="h-4 w-4" /> {busy ? "發布中..." : "發布日誌"}
        </Button>
      </div>
    </div>
  );
}
