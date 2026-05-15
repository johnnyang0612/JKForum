"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  LayoutGrid,
  FolderTree,
  Settings,
  ScrollText,
  Megaphone,
  Wallet,
  ShieldCheck,
  Receipt,
  Tag,
  Filter,
  Mail,
  Crown,
  AlertTriangle,
  Award,
  Star,
  CreditCard,
  Banknote,
  Tags,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type AdminMenuItem = { href: string; icon: React.ComponentType<{ className?: string }>; label: string };
type AdminMenuGroup = { title: string; items: AdminMenuItem[] };

// 收斂後的後台選單 — 以「店家平台」為核心分組
const adminMenuGroups: AdminMenuGroup[] = [
  {
    title: "店家平台",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "儀表板" },
      { href: "/admin/business-kyc", icon: ShieldCheck, label: "業者 KYC" },
      { href: "/admin/business-ads", icon: Building2, label: "業者廣告審核" },
      { href: "/admin/business-ad-comments", icon: Mail, label: "廣告留言審核" },
      { href: "/admin/ad-ratings", icon: Star, label: "廣告評分審核" },
      { href: "/admin/promotions", icon: Tag, label: "推廣 / 置頂訂單" },
      { href: "/admin/business-tags", icon: Tags, label: "配合項目字典" },
    ],
  },
  {
    title: "金流",
    items: [
      { href: "/admin/wallet-transactions", icon: Wallet, label: "充值紀錄" },
      { href: "/admin/withdrawals", icon: Banknote, label: "提領申請" },
      { href: "/admin/coupons", icon: Receipt, label: "折扣碼" },
      { href: "/admin/vip-subscribers", icon: Crown, label: "VIP 訂閱" },
    ],
  },
  {
    title: "會員 / 內容審核",
    items: [
      { href: "/admin/users", icon: Users, label: "會員管理" },
      { href: "/admin/messages", icon: Mail, label: "私訊監控" },
      { href: "/admin/announcements", icon: Megaphone, label: "公告管理" },
      { href: "/admin/reports", icon: AlertTriangle, label: "檢舉管理" },
      { href: "/admin/banned-words", icon: Filter, label: "敏感詞" },
      { href: "/admin/logs", icon: ScrollText, label: "操作日誌" },
    ],
  },
  {
    title: "平台設定",
    items: [
      { href: "/admin/categories", icon: FolderTree, label: "分類管理" },
      { href: "/admin/forums", icon: LayoutGrid, label: "版區管理" },
      { href: "/admin/levels", icon: Award, label: "等級 / Tier 設定" },
      { href: "/admin/settings", icon: Settings, label: "系統設定" },
      { href: "/admin/platform", icon: CreditCard, label: "平台/金流參數" },
    ],
  },
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
      <nav className="flex-1 px-3 py-4 space-y-5">
        {adminMenuGroups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </h3>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
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
          </div>
        ))}
      </nav>

      <div className="px-3 pb-4 pt-2 border-t">
        <p className="text-[10px] text-muted-foreground">
          論壇 / 遊戲 / 商城 / 聊天 / 打賞 / 勳章 等模組路由仍保留，僅未列入導覽。
        </p>
      </div>
    </aside>
  );
}

export { AdminSidebar };
