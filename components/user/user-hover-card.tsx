"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { UserAvatar } from "./user-avatar";
import { UserBadge } from "./user-badge";
import { cn } from "@/lib/utils/cn";

interface UserHoverCardProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    level?: number;
    bio?: string | null;
    postCount?: number;
    followerCount?: number;
  };
  children: React.ReactNode;
}

export function UserHoverCard({ user, children }: UserHoverCardProps) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  function handleMouseEnter() {
    timeoutRef.current = setTimeout(() => setShow(true), 300);
  }

  function handleMouseLeave() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShow(false);
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {show && (
        <div
          className={cn(
            "absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border bg-card p-4 shadow-lg",
            "animate-fade-in"
          )}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-start gap-3">
            <UserAvatar
              src={user.avatarUrl}
              fallback={user.displayName}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/profile/${user.id}`}
                className="font-semibold text-sm hover:text-primary transition-colors"
              >
                {user.displayName}
              </Link>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
              {user.level != null && (
                <div className="mt-1">
                  <UserBadge level={user.level} />
                </div>
              )}
            </div>
          </div>
          {user.bio && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
              {user.bio}
            </p>
          )}
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            {user.postCount != null && (
              <span><strong className="text-foreground">{user.postCount}</strong> 文章</span>
            )}
            {user.followerCount != null && (
              <span><strong className="text-foreground">{user.followerCount}</strong> 粉絲</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
