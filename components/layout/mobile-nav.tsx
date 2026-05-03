"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Store, PenSquare, Gamepad2, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/", icon: Home, label: "首頁" },
  { href: "/listing", icon: Store, label: "店家" },
  { href: "/posts/new", icon: PenSquare, label: "發文", highlight: true },
  { href: "/achieve/game", icon: Gamepad2, label: "遊戲" },
  { href: "/profile", icon: UserCircle, label: "我的", requireAuth: true },
];

function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-md lg:hidden safe-area-pb">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          if (item.requireAuth && !session?.user) {
            const fallbackHref = item.label === "通知" ? "/login" : "/login";
            return (
              <Link
                key={item.label}
                href={fallbackHref}
                className="flex flex-1 flex-col items-center gap-0.5 py-2 text-muted-foreground transition-colors"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          }

          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          if (item.highlight) {
            return (
              <Link
                key={item.label}
                href={session?.user ? item.href : "/login"}
                className="flex flex-1 flex-col items-center gap-0.5 py-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md">
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-medium text-primary">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export { MobileNav };
