"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { cn } from "@/lib/utils/cn";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function MessageBell() {
  const { data } = useSWR("/api/messages/unread-count", fetcher, {
    refreshInterval: 15000,
  });

  const unreadCount = data?.data?.unreadCount || 0;

  return (
    <Link
      href="/messages"
      className="relative inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      aria-label="私訊"
    >
      <Mail className="h-5 w-5" />
      {unreadCount > 0 && (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full bg-danger text-white text-[10px] font-bold",
            unreadCount > 99 ? "h-5 w-7 px-1" : "h-4 w-4"
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
