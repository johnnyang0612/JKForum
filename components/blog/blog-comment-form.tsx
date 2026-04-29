"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function BlogCommentForm({ blogId }: { blogId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  if (!session?.user) {
    return (
      <p className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
        登入後可留言
      </p>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/blogs/${blogId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!json.success) toast.error(json.error);
      else {
        setContent("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={500}
        placeholder="留言..."
        className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
      />
      <Button type="submit" disabled={!content.trim() || busy}>
        送出
      </Button>
    </form>
  );
}
