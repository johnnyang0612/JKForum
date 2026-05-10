"use client";

import { useState, useTransition } from "react";
import { ThumbsUp, ThumbsDown, Star, Share2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import { toggleLike, toggleFavorite } from "@/lib/actions/like-actions";

interface PostActionsProps {
  postId: string;
  likeCount: number;
  dislikeCount: number;
  favoriteCount: number;
  isLiked?: boolean;
  isDisliked?: boolean;
  isFavorited?: boolean;
  isAuthenticated?: boolean;
}

export function PostActions({
  postId,
  likeCount: initialLikeCount,
  dislikeCount: initialDislikeCount,
  favoriteCount: initialFavoriteCount,
  isLiked: initialIsLiked = false,
  isDisliked: initialIsDisliked = false,
  isFavorited: initialIsFavorited = false,
  isAuthenticated = false,
}: PostActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialIsLiked);
  const [disliked, setDisliked] = useState(initialIsDisliked);
  const [favorited, setFavorited] = useState(initialIsFavorited);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
  const [favoriteCount, setFavoriteCount] = useState(initialFavoriteCount);

  function handleLike() {
    if (!isAuthenticated) return;
    startTransition(async () => {
      const result = await toggleLike(postId, "post", true);
      if (result.success) {
        if (result.action === "created") {
          setLiked(true);
          setLikeCount((c) => c + 1);
          if (disliked) {
            setDisliked(false);
            setDislikeCount((c) => c - 1);
          }
        } else if (result.action === "removed") {
          setLiked(false);
          setLikeCount((c) => c - 1);
        } else if (result.action === "updated") {
          setLiked(true);
          setDisliked(false);
          setLikeCount((c) => c + 1);
          setDislikeCount((c) => c - 1);
        }
      }
    });
  }

  function handleDislike() {
    if (!isAuthenticated) return;
    startTransition(async () => {
      const result = await toggleLike(postId, "post", false);
      if (result.success) {
        if (result.action === "created") {
          setDisliked(true);
          setDislikeCount((c) => c + 1);
          if (liked) {
            setLiked(false);
            setLikeCount((c) => c - 1);
          }
        } else if (result.action === "removed") {
          setDisliked(false);
          setDislikeCount((c) => c - 1);
        } else if (result.action === "updated") {
          setDisliked(true);
          setLiked(false);
          setDislikeCount((c) => c + 1);
          setLikeCount((c) => c - 1);
        }
      }
    });
  }

  function handleFavorite() {
    if (!isAuthenticated) return;
    startTransition(async () => {
      const result = await toggleFavorite(postId);
      if (result.success) {
        setFavorited(result.favorited ?? false);
        setFavoriteCount((c) => c + (result.favorited ? 1 : -1));
      }
    });
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-b py-3">
      <Button
        variant={liked ? "default" : "outline"}
        size="sm"
        disabled={isPending || !isAuthenticated}
        onClick={handleLike}
        className={cn("min-h-[40px] px-3", liked && "bg-primary")}
      >
        <ThumbsUp className="h-4 w-4 mr-1" />
        {formatNumber(likeCount)}
      </Button>
      <Button
        variant={disliked ? "destructive" : "outline"}
        size="sm"
        disabled={isPending || !isAuthenticated}
        onClick={handleDislike}
        className="min-h-[40px] px-3"
      >
        <ThumbsDown className="h-4 w-4 mr-1" />
        {formatNumber(dislikeCount)}
      </Button>
      <Button
        variant={favorited ? "default" : "outline"}
        size="sm"
        disabled={isPending || !isAuthenticated}
        onClick={handleFavorite}
        className={cn("min-h-[40px] px-3", favorited && "bg-yellow-500 hover:bg-yellow-600 text-white")}
      >
        <Star className={cn("h-4 w-4 mr-1", favorited && "fill-current")} />
        {formatNumber(favoriteCount)}
      </Button>
      <Button variant="outline" size="sm" className="min-h-[40px] px-3" onClick={handleShare}>
        <Share2 className="h-4 w-4 mr-1" />
        分享
      </Button>
      {isAuthenticated && (
        <a href={`#report-${postId}`}>
          <Button variant="ghost" size="sm" className="min-h-[40px] px-3 text-muted-foreground">
            <Flag className="h-4 w-4 mr-1" />
            檢舉
          </Button>
        </a>
      )}
    </div>
  );
}
