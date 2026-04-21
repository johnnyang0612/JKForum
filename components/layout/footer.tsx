import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface FooterProps {
  className?: string;
}

function Footer({ className }: FooterProps) {
  return (
    <footer
      className={cn(
        "border-t bg-card py-6 text-sm text-muted-foreground",
        className
      )}
    >
      <div className="container-main">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link href="/team" className="transition-colors hover:text-foreground">
              管理團隊
            </Link>
            <Link href="/faq" className="transition-colors hover:text-foreground">
              常見問題
            </Link>
            <Link href="/orders" className="transition-colors hover:text-foreground">
              我的訂單
            </Link>
            <Link href="/flink" className="transition-colors hover:text-foreground">
              友站連結
            </Link>
            <Link href="/leaderboard" className="transition-colors hover:text-foreground">
              排行榜
            </Link>
          </nav>
          <p>&copy; 2026 JKForum. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
