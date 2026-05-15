"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  FileText,
  Users,
  Flame,
  PanelLeftClose,
  PanelLeftOpen,
  MessageCircle,
  Store,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AdWrapper } from "@/components/ad/ad-wrapper";
import { SidebarPinnedFavorites } from "@/components/layout/sidebar-pinned-favorites";

interface ForumLink {
  name: string;
  slug: string;
  icon?: string;
}

interface CategoryGroup {
  name: string;
  slug: string;
  forums: ForumLink[];
}

export interface SidebarProps {
  categories?: CategoryGroup[];
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  className?: string;
}

const quickLinks = [
  { href: "/", icon: Store, label: "店家總覽" },
  { href: "/hot", icon: Flame, label: "熱門文章" },
  { href: "/favorites", icon: Bookmark, label: "我的收藏" },
  { href: "/my-posts", icon: FileText, label: "我的文章" },
  { href: "/messages", icon: MessageCircle, label: "私訊" },
  { href: "/follow", icon: Users, label: "追蹤動態" },
  { href: "/business/ads", icon: Building2, label: "業者後台" },
];

function Sidebar({ categories = [], collapsed = false, onCollapse, className }: SidebarProps) {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const toggleCategory = (slug: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-[calc(100vh-theme(spacing.header))] sticky top-header border-r bg-card overflow-y-auto scrollbar-hide transition-all duration-300",
        collapsed ? "w-16" : "w-sidebar",
        className
      )}
    >
      {/* Collapse toggle */}
      <div className="flex items-center justify-end p-2">
        <button
          type="button"
          onClick={() => onCollapse?.(!collapsed)}
          className="rounded-md p-1.5 hover:bg-muted text-muted-foreground"
          aria-label={collapsed ? "展開側邊欄" : "收合側邊欄"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Quick links */}
      <nav className="px-2 pb-4">
        {!collapsed && (
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            快捷功能
          </h3>
        )}
        <ul className="space-y-0.5">
          {quickLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title={collapsed ? link.label : undefined}
                >
                  <link.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 收藏釘板（可拖曳排序） */}
      <SidebarPinnedFavorites collapsed={collapsed} />

      {/* 側邊欄廣告 */}
      {!collapsed && (
        <div className="p-2 mt-auto">
          <AdWrapper position="SIDEBAR" />
        </div>
      )}
    </aside>
  );
}

export { Sidebar };
