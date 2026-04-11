import Link from "next/link";
import { Eye, Clock, ChevronRight } from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils/format";

interface PostMetaProps {
  author: {
    id: string;
    displayName: string;
  };
  createdAt: Date | string;
  viewCount: number;
  forum?: {
    name: string;
    slug: string;
    category?: {
      name: string;
      slug: string;
    };
  };
}

export function PostMeta({ author, createdAt, viewCount, forum }: PostMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
      {/* Breadcrumb */}
      {forum && (
        <>
          {forum.category && (
            <>
              <Link
                href={`/forums/${forum.category.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {forum.category.name}
              </Link>
              <ChevronRight className="h-3 w-3" />
            </>
          )}
          <Link
            href={`/forums/${forum.category?.slug}/${forum.slug}`}
            className="hover:text-foreground transition-colors"
          >
            {forum.name}
          </Link>
          <span className="mx-1">|</span>
        </>
      )}
      <Link
        href={`/profile/${author.id}`}
        className="font-medium hover:text-foreground transition-colors"
      >
        {author.displayName}
      </Link>
      <span className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {formatDate(createdAt)}
      </span>
      <span className="flex items-center gap-1">
        <Eye className="h-3 w-3" />
        {formatNumber(viewCount)} 次查看
      </span>
    </div>
  );
}
