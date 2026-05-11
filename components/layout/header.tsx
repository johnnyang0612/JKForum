"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  Menu,
  Sun,
  Moon,
  Bell,
  User,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  Shield,
  ShieldCheck,
  Building2,
  X,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/providers/theme-provider";
import { MessageBell } from "@/components/message/message-bell";
import { InstallPwaButton } from "@/components/pwa/install-pwa-button";

export interface HeaderProps {
  onMenuToggle?: () => void;
}

function Header({ onMenuToggle }: HeaderProps) {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-40 h-header w-full border-b bg-card/80 backdrop-blur-md">
      <div className="container-main flex h-full items-center gap-2 sm:gap-4">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMenuToggle}
            className="rounded-md p-2 hover:bg-muted lg:hidden"
            aria-label="選單"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            href="/"
            className="text-xl font-bold text-primary whitespace-nowrap"
          >
            JKForum
          </Link>
        </div>

        {/* Center: Search (desktop) */}
        <div className="hidden flex-1 sm:flex sm:max-w-md sm:mx-auto">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋文章、看板..."
              className="h-9 w-full rounded-full border bg-muted/50 pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-ring"
            />
          </form>
        </div>

        {/* Mobile search toggle */}
        <div className="flex-1 sm:hidden" />
        <button
          type="button"
          onClick={() => setSearchOpen(!searchOpen)}
          className="rounded-md p-2 hover:bg-muted sm:hidden"
          aria-label="搜尋"
        >
          {searchOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </button>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md p-2 hover:bg-muted"
            aria-label="切換主題"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {/* PWA 安裝 (登入/未登入都可) */}
          <InstallPwaButton variant="icon" />

          {session?.user ? (
            <>
              {/* Messages */}
              <MessageBell />

              {/* Notifications */}
              <Link
                href="/notifications"
                className="relative rounded-md p-2 hover:bg-muted"
                aria-label="通知"
              >
                <Bell className="h-5 w-5" />
                {/* Unread badge - can wire to real data later */}
              </Link>

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full">
                  <Avatar
                    src={session.user.image}
                    fallback={session.user.name || session.user.username}
                    size="sm"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="font-medium">{session.user.name || session.user.username}</div>
                    <div className="text-xs font-normal text-muted-foreground">{session.user.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    icon={<User className="h-4 w-4" />}
                    onClick={() => { window.location.href = `/profile/${session.user.id}`; }}
                  >
                    個人資料
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    icon={<Settings className="h-4 w-4" />}
                    onClick={() => { window.location.href = "/settings"; }}
                  >
                    設定
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* 業者後台（業者帳號或 admin 都可見） */}
                  {(session.user as { userType?: string }).userType === "BUSINESS" && (
                    <DropdownMenuItem
                      icon={<Building2 className="h-4 w-4" />}
                      onClick={() => { window.location.href = "/business/ads"; }}
                    >
                      業者後台
                    </DropdownMenuItem>
                  )}
                  {/* 版務後台 — 任一版主或 admin 都顯示，後端 layout 會再驗 */}
                  <DropdownMenuItem
                    icon={<Shield className="h-4 w-4" />}
                    onClick={() => { window.location.href = "/moderator"; }}
                  >
                    版務後台
                  </DropdownMenuItem>
                  {/* 完整管理後台（admin only） */}
                  {(session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN") && (
                    <DropdownMenuItem
                      icon={<ShieldCheck className="h-4 w-4" />}
                      onClick={() => { window.location.href = "/admin"; }}
                    >
                      管理後台
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    icon={<LogOut className="h-4 w-4" />}
                    destructive
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  <LogIn className="mr-1.5 h-4 w-4" />
                  <span className="hidden xs:inline">登入</span>
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  <span className="hidden xs:inline">註冊</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search bar (expandable) */}
      {searchOpen && (
        <div className="border-t bg-card px-4 py-2 sm:hidden">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋文章、看板..."
              className="h-9 w-full rounded-full border bg-muted/50 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </form>
        </div>
      )}
    </header>
  );
}

export { Header };
