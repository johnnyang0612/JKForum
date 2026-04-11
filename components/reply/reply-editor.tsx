"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createReply } from "@/lib/actions/reply-actions";

interface ReplyEditorProps {
  postId: string;
  parentId?: string;
  placeholder?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReplyEditor({
  postId,
  parentId,
  placeholder = "撰寫回覆...",
  onSuccess,
  onCancel,
}: ReplyEditorProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!content.trim()) {
      setError("請輸入回覆內容");
      return;
    }

    setError("");
    startTransition(async () => {
      const formData = new FormData();
      formData.set("postId", postId);
      formData.set("content", content);
      if (parentId) formData.set("parentId", parentId);

      const result = await createReply(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setContent("");
        onSuccess?.();
      }
    });
  }

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <Textarea
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={10000}
        showCount
        className="min-h-[100px]"
      />
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleSubmit}
          loading={isPending}
          disabled={!content.trim()}
        >
          發表回覆
        </Button>
      </div>
    </div>
  );
}
