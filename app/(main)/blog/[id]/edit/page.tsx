"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BlogEditor, type BlogEditorValue } from "@/components/blog/blog-editor";
import { Save } from "lucide-react";

export default function EditBlogPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [v, setV] = useState<BlogEditorValue | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/blogs/${params.id}`).then(r => r.json()).then(j => {
      if (!j.success) { toast.error("找不到日誌"); return; }
      const b = j.blog;
      setV({
        title: b.title, content: b.content, coverUrl: b.coverUrl ?? "",
        isPublic: b.isPublic, hasVideo: b.hasVideo,
      });
    });
  }, [params.id]);

  async function save(asDraft: boolean) {
    if (!v) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/blogs/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: v.title, content: v.content, coverUrl: v.coverUrl || null,
          isPublic: v.isPublic, hasVideo: v.hasVideo,
          status: asDraft ? "DRAFT" : "PUBLISHED",
        }),
      });
      const j = await r.json();
      if (j.success) {
        toast.success("已儲存");
        router.push(asDraft ? "/blog" : `/blog/${params.id}`);
      } else toast.error(j.error);
    } finally { setBusy(false); }
  }

  if (!v) return <p>載入中...</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">✏️ 編輯日誌</h1>
      <div className="rounded-xl border bg-card p-5">
        <BlogEditor initial={v} onChange={setV} busy={busy} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => save(true)} disabled={busy}>
          <Save className="h-4 w-4" /> 存草稿
        </Button>
        <Button onClick={() => save(false)} disabled={busy}>
          {busy ? "儲存中..." : "更新發布"}
        </Button>
      </div>
    </div>
  );
}
