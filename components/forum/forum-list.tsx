import { ForumCard } from "./forum-card";
import { cn } from "@/lib/utils/cn";

interface ForumListProps {
  forums: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    iconUrl: string | null;
    postCount: number;
    todayPostCount: number;
    category: { slug: string };
  }>;
  layout?: "grid" | "list";
  className?: string;
}

export function ForumList({ forums, layout = "grid", className }: ForumListProps) {
  if (forums.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        暫無看板
      </div>
    );
  }

  return (
    <div
      className={cn(
        layout === "grid"
          ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          : "flex flex-col gap-3",
        className
      )}
    >
      {forums.map((forum) => (
        <ForumCard key={forum.id} forum={forum} />
      ))}
    </div>
  );
}
