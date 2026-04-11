"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import { UserAvatar } from "@/components/user/user-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

export interface ConversationItemData {
  id: string;
  updatedAt: string | Date;
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string | Date;
  } | null;
  unreadCount: number;
}

interface ConversationItemProps {
  conversation: ConversationItemData;
  isActive?: boolean;
  currentUserId?: string;
}

export function ConversationItem({
  conversation,
  isActive = false,
  currentUserId,
}: ConversationItemProps) {
  const { otherUser, lastMessage, unreadCount } = conversation;

  if (!otherUser) return null;

  const timeAgo = lastMessage
    ? formatDistanceToNow(new Date(lastMessage.createdAt), {
        addSuffix: true,
        locale: zhTW,
      })
    : "";

  const isMyMessage = lastMessage?.senderId === currentUserId;
  const previewText = lastMessage
    ? isMyMessage
      ? `你：${lastMessage.content}`
      : lastMessage.content
    : "尚無訊息";

  return (
    <Link
      href={`/messages/${conversation.id}`}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50",
        isActive && "bg-muted",
        unreadCount > 0 && !isActive && "bg-primary/5"
      )}
    >
      <UserAvatar
        src={otherUser.avatarUrl}
        fallback={otherUser.displayName}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              unreadCount > 0 ? "font-bold text-foreground" : "font-medium text-foreground"
            )}
          >
            {otherUser.displayName}
          </span>
          {timeAgo && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {timeAgo}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-xs",
              unreadCount > 0
                ? "font-medium text-foreground"
                : "text-muted-foreground"
            )}
          >
            {previewText}
          </p>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="shrink-0 text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
