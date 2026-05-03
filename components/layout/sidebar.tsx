"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Flame,
  Clock,
  Bookmark,
  FileText,
  Users,
  Trophy,
  ChevronDown,
  ChevronRight,
  Hash,
  PanelLeftClose,
  PanelLeftOpen,
  Gamepad2,
  MessageCircle,
  BookOpen,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AdWrapper } from "@/components/ad/ad-wrapper";

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
  { href: "/", icon: Home, label: "首頁" },
  { href: "/follow", icon: Users, label: "追蹤動態" },
  { href: "/friends", icon: Users, label: "我的好友" },
  { href: "/hot", icon: Flame, label: "熱門文章" },
  { href: "/latest", icon: Clock, label: "最新文章" },
  { href: "/leaderboard", icon: Trophy, label: "排行榜" },
  { href: "/chat", icon: MessageCircle, label: "即時聊天室" },
  { href: "/blog", icon: BookOpen, label: "個人日誌" },
  { href: "/downloads", icon: Download, label: "下載專區" },
  { href: "/achieve/game", icon: Gamepad2, label: "遊戲中心" },
  { href: "/favorites", icon: Bookmark, label: "我的收藏" },
  { href: "/my-posts", icon: FileText, label: "我的文章" },
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

      {!collapsed && categories.length > 0 && (
        <>
          <div className="mx-3 h-px bg-border" />

          {/* Forum navigation */}
          <nav className="flex-1 px-2 py-4">
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              看板導航
            </h3>
            <ul className="space-y-0.5">
              {categories.map((category) => {
                const isExpanded = expandedCategories.has(category.slug);
                return (
                  <li key={category.slug}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.slug)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate">{category.name}</span>
                    </button>
                    {isExpanded && (
                      <ul className="ml-4 mt-0.5 space-y-0.5 border-l pl-2">
                        {category.forums.map((forum) => {
                          const forumPath = `/forums/${category.slug}/${forum.slug}`;
                          const isActive = pathname === forumPath;
                          return (
                            <li key={forum.slug}>
                              <Link
                                href={forumPath}
                                className={cn(
                                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                                  isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                <Hash className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{forum.name}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}

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
