"use client";

import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "./notification-item";
import { markAllNotificationsAsRead } from "@/lib/actions/notification-actions";

interface NotificationListProps {
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    content: string | null;
    linkUrl: string | null;
    isRead: boolean;
    createdAt: Date | string;
  }>;
  hasUnread?: boolean;
}

export function NotificationList({ notifications, hasUnread = false }: NotificationListProps) {
  const [isPending, startTransition] = useTransition();

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsAsRead();
    });
  }

  return (
    <div className="space-y-3">
      {hasUnread && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            loading={isPending}
            className="text-xs"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            全部標為已讀
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          暫無通知
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      )}
    </div>
  );
}
