"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  LayoutGrid,
  FileText,
  AlertTriangle,
  Award,
  Settings,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const adminMenuItems = [
  { href: "/admin", icon: LayoutDashboard, label: "儀表板" },
  { href: "/admin/users", icon: Users, label: "會員管理" },
  { href: "/admin/forums", icon: LayoutGrid, label: "看板管理" },
  { href: "/admin/posts", icon: FileText, label: "文章管理" },
  { href: "/admin/reports", icon: AlertTriangle, label: "檢舉管理" },
  { href: "/admin/levels", icon: Award, label: "等級設定" },
  { href: "/admin/settings", icon: Settings, label: "系統設定" },
  { href: "/admin/logs", icon: ScrollText, label: "操作日誌" },
];

export interface AdminSidebarProps {
  className?: string;
}

function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col w-60 h-[calc(100vh-theme(spacing.header))] sticky top-header border-r bg-card overflow-y-auto",
        className
      )}
    >
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {adminMenuItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export { AdminSidebar };
