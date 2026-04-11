import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

function Breadcrumb({ items, showHome = true, className }: BreadcrumbProps) {
  const allItems = showHome
    ? [{ label: "首頁", href: "/" }, ...items]
    : items;

  return (
    <nav aria-label="麵包屑導航" className={cn("flex items-center", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;

          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              {isLast || !item.href ? (
                <span
                  className={cn(
                    "flex items-center gap-1",
                    isLast
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {index === 0 && showHome && (
                    <Home className="h-3.5 w-3.5" />
                  )}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {index === 0 && showHome && (
                    <Home className="h-3.5 w-3.5" />
                  )}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { Breadcrumb };
