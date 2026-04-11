import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import { cn } from "@/lib/utils/cn";

export interface TimeAgoProps {
  date: Date | string;
  className?: string;
}

function TimeAgo({ date, className }: TimeAgoProps) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const timeAgo = formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: zhTW,
  });

  return (
    <time
      dateTime={dateObj.toISOString()}
      title={dateObj.toLocaleString("zh-TW")}
      className={cn("text-sm text-muted-foreground", className)}
    >
      {timeAgo}
    </time>
  );
}

export { TimeAgo };
