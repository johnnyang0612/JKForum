"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ReplyActions } from "./reply-actions";
import { ReplyEditor } from "./reply-editor";
import { ReportButton } from "@/components/post/report-button";
import { cn } from "@/lib/utils/cn";
import { timeAgo } from "@/lib/utils/format";
import { getLevelByIndex } from "@/lib/constants/levels";

interface ReplyItemProps {
  reply: {
    id: string;
    postId: string;
    content: string;
    floor: number;
    likeCount: number;
    dislikeCount: number;
    createdAt: Date | string;
    status: string;
    author: {
      id: string;
      username: string;
      displayName: string;
      profile?: { avatarUrl: string | null } | null;
      points?: { level: number } | null;
    };
    children?: ReplyItemProps["reply"][];
    isLiked?: boolean;
  };
  isAuthenticated?: boolean;
  currentUserId?: string;
  depth?: number;
}

export function ReplyItem({
  reply,
  isAuthenticated = false,
  currentUserId,
  depth = 0,
}: ReplyItemProps) {
  const [showReplyEditor, setShowReplyEditor] = useState(false);
  const level = reply.author.points
    ? getLevelByIndex(reply.author.points.level)
    : null;

  if (reply.status === "DELETED") {
    return (
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground italic">
        此回覆已被刪除
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card",
        depth > 0 && "ml-8 border-l-2 border-l-primary/20"
      )}
      id={`reply-${reply.id}`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${reply.author.id}`}>
              <Avatar
                src={reply.author.profile?.avatarUrl}
                fallback={reply.author.displayName}
                size="sm"
              />
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${reply.author.id}`}
                className="text-sm font-semibold hover:text-primary transition-colors"
              >
                {reply.author.displayName}
              </Link>
              {level && (
                <span
                  className="text-[10px] font-bold rounded px-1"
                  style={{ color: level.color }}
                >
                  {level.name}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {timeAgo(reply.createdAt)}
              </span>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            #{reply.floor}
          </Badge>
        </div>

        {/* Content */}
        <div
          className="mt-3 prose prose-sm prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: reply.content }}
        />

        {/* Actions */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <ReplyActions
            replyId={reply.id}
            likeCount={reply.likeCount}
            isLiked={reply.isLiked}
            isAuthenticated={isAuthenticated}
            canReply={depth < 2}
            onQuote={() => setShowReplyEditor(!showReplyEditor)}
          />
          {isAuthenticated && currentUserId !== reply.author.id && (
            <ReportButton targetType="REPLY" targetId={reply.id} size="sm" />
          )}
        </div>

        {/* Inline reply editor */}
        {showReplyEditor && isAuthenticated && (
          <div className="mt-3">
            <ReplyEditor
              postId={reply.postId}
              parentId={reply.id}
              placeholder={`回覆 ${reply.author.displayName}...`}
              onSuccess={() => setShowReplyEditor(false)}
              onCancel={() => setShowReplyEditor(false)}
            />
          </div>
        )}
      </div>

      {/* Children */}
      {reply.children && reply.children.length > 0 && (
        <div className="space-y-0 border-t">
          {reply.children.map((child) => (
            <ReplyItem
              key={child.id}
              reply={child}
              isAuthenticated={isAuthenticated}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
