"use client";

import { useState, useTransition } from "react";
import { Heart, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

export interface LikeButtonProps {
  initialLiked: boolean;
  initialCount: number;
  onToggle?: (liked: boolean) => Promise<void>;
  variant?: "heart" | "thumb";
  className?: string;
}

function LikeButton({
  initialLiked,
  initialCount,
  onToggle,
  variant = "heart",
  className,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  const Icon = variant === "heart" ? Heart : ThumbsUp;

  const handleClick = () => {
    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setCount((prev) => prev + (newLiked ? 1 : -1));

    startTransition(async () => {
      try {
        await onToggle?.(newLiked);
      } catch {
        // Revert on error
        setLiked(!newLiked);
        setCount((prev) => prev + (newLiked ? -1 : 1));
        toast.error("操作失敗，請稍後再試");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors",
        "hover:bg-muted disabled:opacity-50",
        liked
          ? variant === "heart"
            ? "text-danger"
            : "text-primary"
          : "text-muted-foreground",
        className
      )}
      aria-label={liked ? "取消按讚" : "按讚"}
    >
      <Icon
        className={cn(
          "h-4 w-4 transition-transform",
          liked && "fill-current scale-110"
        )}
      />
      <span>{count}</span>
    </button>
  );
}

export { LikeButton };
