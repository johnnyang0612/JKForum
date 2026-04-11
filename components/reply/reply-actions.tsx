"use client";

import { useState, useTransition } from "react";
import { ThumbsUp, MessageCircle, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import { toggleLike } from "@/lib/actions/like-actions";

interface ReplyActionsProps {
  replyId: string;
  likeCount: number;
  isLiked?: boolean;
  isAuthenticated?: boolean;
  canReply?: boolean;
  onQuote?: () => void;
}

export function ReplyActions({
  replyId,
  likeCount: initialLikeCount,
  isLiked: initialIsLiked = false,
  isAuthenticated = false,
  canReply = true,
  onQuote,
}: ReplyActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  function handleLike() {
    if (!isAuthenticated) return;
    startTransition(async () => {
      const result = await toggleLike(replyId, "reply", true);
      if (result.success) {
        if (result.action === "created") {
          setLiked(true);
          setLikeCount((c) => c + 1);
        } else if (result.action === "removed") {
          setLiked(false);
          setLikeCount((c) => c - 1);
        }
      }
    });
  }

  return (
    <div className="flex items-center gap-1 text-xs">
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending || !isAuthenticated}
        onClick={handleLike}
        className={cn(
          "h-7 px-2 text-xs text-muted-foreground",
          liked && "text-primary"
        )}
      >
        <ThumbsUp className={cn("h-3 w-3 mr-1", liked && "fill-current")} />
        {likeCount > 0 ? formatNumber(likeCount) : "讚"}
      </Button>
      {canReply && isAuthenticated && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onQuote}
          className="h-7 px-2 text-xs text-muted-foreground"
        >
          <MessageCircle className="h-3 w-3 mr-1" />
          回覆
        </Button>
      )}
      {isAuthenticated && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground"
        >
          <Flag className="h-3 w-3 mr-1" />
          檢舉
        </Button>
      )}
    </div>
  );
}
