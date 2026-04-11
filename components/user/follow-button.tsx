"use client";

import { useState, useTransition } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { toggleFollow } from "@/lib/actions/follow-actions";

interface FollowButtonProps {
  userId: string;
  isFollowing?: boolean;
  isAuthenticated?: boolean;
  className?: string;
}

export function FollowButton({
  userId,
  isFollowing: initialIsFollowing = false,
  isAuthenticated = false,
  className,
}: FollowButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialIsFollowing);

  function handleToggle() {
    if (!isAuthenticated) return;
    startTransition(async () => {
      const result = await toggleFollow(userId);
      if (result.success) {
        setFollowing(result.following ?? false);
      }
    });
  }

  if (!isAuthenticated) return null;

  return (
    <Button
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={handleToggle}
      loading={isPending}
      className={cn(following && "text-muted-foreground", className)}
    >
      {following ? (
        <>
          <UserCheck className="h-4 w-4 mr-1" />
          已追蹤
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1" />
          追蹤
        </>
      )}
    </Button>
  );
}
