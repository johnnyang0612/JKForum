"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Trash2, MoreVertical } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { cn } from "@/lib/utils/cn";
import { deleteMessage } from "@/lib/actions/message-actions";

export interface MessageData {
  id: string;
  content: string;
  isDeleted: boolean;
  createdAt: string | Date;
  sender: {
    id: string;
    username: string;
    displayName: string;
    profile?: { avatarUrl: string | null } | null;
  };
}

interface MessageBubbleProps {
  message: MessageData;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(message.isDeleted);

  const timeAgo = formatDistanceToNow(new Date(message.createdAt), {
    addSuffix: true,
    locale: zhTW,
  });

  function handleDelete() {
    if (!confirm("確定要刪除這則訊息嗎？")) return;
    startTransition(async () => {
      const result = await deleteMessage(message.id);
      if (result.success) {
        setDeleted(true);
      }
    });
  }

  return (
    <div
      className={cn(
        "group flex items-end gap-2",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar (only for others) */}
      {!isOwn && (
        <UserAvatar
          src={message.sender.profile?.avatarUrl}
          fallback={message.sender.displayName}
          size="sm"
          className="mb-1"
        />
      )}

      <div className={cn("flex max-w-[70%] flex-col gap-0.5", isOwn ? "items-end" : "items-start")}>
        {/* Sender name (only for others) */}
        {!isOwn && (
          <span className="px-1 text-xs text-muted-foreground">
            {message.sender.displayName}
          </span>
        )}

        {/* Message bubble */}
        <div className="flex items-center gap-1">
          {/* Delete action (own messages only) */}
          {isOwn && showActions && !deleted && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-danger group-hover:opacity-100"
              aria-label="刪除訊息"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <div
            className={cn(
              "rounded-2xl px-4 py-2 text-sm leading-relaxed",
              deleted
                ? "bg-muted text-muted-foreground italic"
                : isOwn
                ? "bg-primary text-white"
                : "bg-muted text-foreground"
            )}
          >
            {deleted ? "（訊息已刪除）" : message.content}
          </div>
        </div>

        {/* Time */}
        <span className="px-1 text-[10px] text-muted-foreground">
          {timeAgo}
        </span>
      </div>
    </div>
  );
}
