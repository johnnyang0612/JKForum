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
    rating?: string;
    ageGateEnabled?: boolean;
    category: {
      slug: string;
    };
  };
  className?: string;
}

export function ForumCard({ forum, className }: ForumCardProps) {
  const isR18 = forum.rating === "R18" || !!forum.ageGateEnabled;
  return (
    <Link
      href={`/forums/${forum.category.slug}/${forum.slug}`}
      className={cn(
        "group block rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:shadow-sm",
        isR18 && "border-rose-500/30",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg",
          isR18 ? "bg-rose-500/10" : "bg-primary/10"
        )}>
          {forum.iconUrl ? (
            <img src={forum.iconUrl} alt="" className="h-6 w-6 rounded" />
          ) : isR18 ? (
            <span className="text-base">🔞</span>
          ) : (
            <MessageSquare className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {forum.name}
            {isR18 && (
              <span className="ml-2 inline-block rounded bg-rose-600/95 px-1 py-0.5 text-[9px] font-bold text-white align-middle">
                18+
              </span>
            )}
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
