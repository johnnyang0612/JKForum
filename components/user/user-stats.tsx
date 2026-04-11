import { FileText, MessageCircle, ThumbsUp, Users } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";

interface UserStatsProps {
  postCount: number;
  replyCount: number;
  likeCount: number;
  followerCount: number;
}

const stats = [
  { key: "postCount", label: "文章", icon: FileText },
  { key: "replyCount", label: "回覆", icon: MessageCircle },
  { key: "likeCount", label: "獲讚", icon: ThumbsUp },
  { key: "followerCount", label: "粉絲", icon: Users },
] as const;

export function UserStats({ postCount, replyCount, likeCount, followerCount }: UserStatsProps) {
  const values = { postCount, replyCount, likeCount, followerCount };

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map(({ key, label, icon: Icon }) => (
        <div
          key={key}
          className="flex flex-col items-center gap-1 rounded-lg border bg-card p-3 text-center"
        >
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-lg font-bold text-foreground">
            {formatNumber(values[key])}
          </span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
