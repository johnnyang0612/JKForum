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
            <Link
              href="/about"
              className="transition-colors hover:text-foreground"
            >
              關於我們
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              使用條款
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              隱私政策
            </Link>
            <Link
              href="/contact"
              className="transition-colors hover:text-foreground"
            >
              聯繫我們
            </Link>
          </nav>
          <p>&copy; 2026 JKForum. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
