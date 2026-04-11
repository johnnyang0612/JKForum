import Link from "next/link";
import { FileText, User, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils/format";

interface SearchResult {
  type: "post" | "user" | "forum";
  id: string;
  title: string;
  excerpt?: string;
  url: string;
  createdAt?: Date | string;
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  post: FileText,
  user: User,
  forum: MessageSquare,
};

const TYPE_LABELS: Record<string, string> = {
  post: "文章",
  user: "用戶",
  forum: "看板",
};

export function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="text-lg">找不到「{query}」的搜尋結果</p>
        <p className="mt-2 text-sm">請嘗試不同的關鍵字</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((result) => {
        const Icon = TYPE_ICONS[result.type] || FileText;

        return (
          <Link
            key={`${result.type}-${result.id}`}
            href={result.url}
            className="flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  {TYPE_LABELS[result.type]}
                </Badge>
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {result.title}
                </h3>
              </div>
              {result.excerpt && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {result.excerpt}
                </p>
              )}
              {result.createdAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {timeAgo(result.createdAt)}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
