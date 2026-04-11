import { MessageSquare, FileText, Users } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";

interface ForumStatsProps {
  postCount: number;
  todayPostCount: number;
  moderators?: Array<{
    user: {
      id: string;
      username: string;
      displayName: string;
    };
  }>;
}

export function ForumStats({ postCount, todayPostCount, moderators }: ForumStatsProps) {
  return (
    <div className="flex flex-wrap items-center gap-6 rounded-lg border bg-card p-4 text-sm">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">總文章數</span>
        <span className="font-semibold">{formatNumber(postCount)}</span>
      </div>
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">今日發文</span>
        <span className="font-semibold text-success">{todayPostCount}</span>
      </div>
      {moderators && moderators.length > 0 && (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">版主</span>
          <span className="font-semibold">
            {moderators.map((m) => m.user.displayName).join("、")}
          </span>
        </div>
      )}
    </div>
  );
}
