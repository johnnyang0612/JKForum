import Link from "next/link";
import { MessageSquare, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";

interface ForumCardProps {
  forum: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    iconUrl: string | null;
    postCount: number;
    todayPostCount: number;
    category: {
      slug: string;
    };
  };
  className?: string;
}

export function ForumCard({ forum, className }: ForumCardProps) {
  return (
    <Link
      href={`/forums/${forum.category.slug}/${forum.slug}`}
      className={cn(
        "group block rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg">
          {forum.iconUrl ? (
            <img src={forum.iconUrl} alt="" className="h-6 w-6 rounded" />
          ) : (
            <MessageSquare className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {forum.name}
          </h3>
          {forum.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {forum.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {formatNumber(forum.postCount)} 篇文章
            </span>
            {forum.todayPostCount > 0 && (
              <span className="flex items-center gap-1 text-success">
                <TrendingUp className="h-3 w-3" />
                今日 +{forum.todayPostCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
