"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  MessageCircle, ThumbsUp, UserPlus, Bell,
  Flag, TrendingUp, Award, AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { timeAgo } from "@/lib/utils/format";
import { markNotificationAsRead } from "@/lib/actions/notification-actions";

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  REPLY: MessageCircle,
  LIKE: ThumbsUp,
  FOLLOW: UserPlus,
  MENTION: AtSign,
  SYSTEM: Bell,
  REPORT_RESULT: Flag,
  LEVEL_UP: TrendingUp,
  ACHIEVEMENT: Award,
};

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    content: string | null;
    linkUrl: string | null;
    isRead: boolean;
    createdAt: Date | string;
  };
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const [, startTransition] = useTransition();
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;

  function handleClick() {
    if (!notification.isRead) {
      startTransition(() => {
        markNotificationAsRead(notification.id);
      });
    }
  }

  const content = (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 rounded-lg p-3 transition-colors cursor-pointer",
        notification.isRead
          ? "hover:bg-muted/50"
          : "bg-primary/5 hover:bg-primary/10"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          notification.isRead ? "bg-muted" : "bg-primary/10"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            notification.isRead ? "text-muted-foreground" : "text-primary"
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", !notification.isRead && "font-semibold")}>
          {notification.title}
        </p>
        {notification.content && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {notification.content}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </div>
  );

  if (notification.linkUrl) {
    return <Link href={notification.linkUrl}>{content}</Link>;
  }

  return content;
}
