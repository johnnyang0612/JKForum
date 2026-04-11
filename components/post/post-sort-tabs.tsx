"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const SORT_OPTIONS = [
  { value: "latest", label: "最新" },
  { value: "popular", label: "熱門" },
  { value: "featured", label: "精華" },
] as const;

interface PostSortTabsProps {
  className?: string;
}

export function PostSortTabs({ className }: PostSortTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "latest";

  function handleSort(sort: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className={cn("flex items-center gap-1 rounded-lg bg-muted p-1", className)}>
      {SORT_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => handleSort(option.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            currentSort === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
