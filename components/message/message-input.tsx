"use client";

import { useState, useRef, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface MessageInputProps {
  conversationId: string;
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed || isPending || disabled) return;

    startTransition(async () => {
      await onSend(trimmed);
      setContent("");
      // 重設 textarea 高度
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    // 自動調整高度
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }

  return (
    <div className="sticky bottom-0 border-t bg-card px-3 py-2.5 safe-area-pb sm:px-4 sm:py-3">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <div className="relative flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="輸入訊息..."
            disabled={isPending || disabled}
            rows={1}
            className={cn(
              "w-full resize-none rounded-xl border bg-muted/50 px-4 py-2.5 text-base sm:text-sm outline-none", // 手機 text-base 防止 iOS 自動 zoom
              "placeholder:text-muted-foreground",
              "focus:bg-background focus:ring-2 focus:ring-ring",
              "disabled:opacity-50"
            )}
            maxLength={5000}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isPending || disabled}
          loading={isPending}
          size="icon"
          className="tap-target shrink-0 rounded-xl"
        >
          {!isPending && <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
