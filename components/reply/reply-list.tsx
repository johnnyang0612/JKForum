import { ReplyItem } from "./reply-item";

interface ReplyListProps {
  replies: Array<{
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
    children?: ReplyListProps["replies"];
    isLiked?: boolean;
  }>;
  isAuthenticated?: boolean;
  currentUserId?: string;
}

export function ReplyList({ replies, isAuthenticated, currentUserId }: ReplyListProps) {
  if (replies.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        暫無回覆，成為第一個回覆的人吧！
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">
        全部回覆 ({replies.length})
      </h2>
      <div className="space-y-3">
        {replies.map((reply) => (
          <ReplyItem
            key={reply.id}
            reply={reply}
            isAuthenticated={isAuthenticated}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
}
