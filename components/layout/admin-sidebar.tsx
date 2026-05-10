"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  LayoutGrid,
  FolderTree,
  FileText,
  MessageSquare,
  AlertTriangle,
  Award,
  Settings,
  ScrollText,
  Megaphone,
  Wallet,
  ShieldCheck,
  Receipt,
  Tag,
  Filter,
  Mail,
  MessageCircle,
  BookOpen,
  Heart,
  Vote,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const adminMenuItems = [
  { href: "/admin", icon: LayoutDashboard, label: "儀表板" },
  { href: "/admin/users", icon: Users, label: "會員管理" },
  { href: "/admin/categories", icon: FolderTree, label: "分類管理" },
  { href: "/admin/forums", icon: LayoutGrid, label: "看板管理" },
  { href: "/admin/posts", icon: FileText, label: "文章管理" },
  { href: "/admin/replies", icon: MessageSquare, label: "回覆管理" },
  { href: "/admin/blogs", icon: BookOpen, label: "日誌管理" },
  { href: "/admin/messages", icon: Mail, label: "私訊監控" },
  { href: "/admin/chat", icon: MessageCircle, label: "即時聊天" },
  { href: "/admin/polls", icon: Vote, label: "投票管理" },
  { href: "/admin/tips", icon: Heart, label: "打賞紀錄" },
  { href: "/admin/reports", icon: AlertTriangle, label: "檢舉管理" },
  { href: "/admin/announcements", icon: Megaphone, label: "公告管理" },
  { href: "/admin/business-kyc", icon: ShieldCheck, label: "業者 KYC" },
  { href: "/admin/business-ads", icon: Tag, label: "業者廣告" },
  { href: "/admin/business-ad-comments", icon: MessageSquare, label: "業者廣告留言" },
  { href: "/admin/wallet-transactions", icon: Wallet, label: "充值紀錄" },
  { href: "/admin/coupons", icon: Receipt, label: "折扣碼" },
  { href: "/admin/vip-subscribers", icon: Crown, label: "VIP 訂閱" },
  { href: "/admin/banned-words", icon: Filter, label: "敏感詞" },
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
