import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import {
  LayoutDashboard, Users, MessageSquare, FileText,
  Flag, Award, Settings, ScrollText, Megaphone,
  Gift, CheckCircle, Star, Settings2, Crown, Medal, Bell, Download, ShieldCheck,
  Building2, Banknote, Tags, FolderTree, BookOpen, Mail, MessageCircle,
  Heart, Vote, Filter, Wallet, Receipt, Hash, Trash2, Calendar,
} from "lucide-react";
import { AdminMobileMenu } from "@/components/admin/admin-mobile-menu";

export const dynamic = 'force-dynamic';

const ADMIN_NAV = [
  { href: "/admin", label: "儀表板", icon: LayoutDashboard, group: "general" },
  { href: "/admin/users", label: "用戶管理", icon: Users, group: "user" },
  { href: "/admin/user-groups", label: "會員組", icon: Crown, group: "user" },
  { href: "/admin/medals", label: "勳章管理", icon: Medal, group: "user" },
  { href: "/admin/email-tokens", label: "驗證管理", icon: ShieldCheck, group: "user" },
  { href: "/admin/checkin", label: "簽到查詢", icon: Calendar, group: "user" },
  { href: "/admin/account-deletions", label: "刪帳號申請", icon: Trash2, group: "user" },

  { href: "/admin/categories", label: "分類管理", icon: FolderTree, group: "content" },
  { href: "/admin/forums", label: "看板管理", icon: MessageSquare, group: "content" },
  { href: "/admin/posts", label: "文章管理", icon: FileText, group: "content" },
  { href: "/admin/replies", label: "回覆管理", icon: MessageSquare, group: "content" },
  { href: "/admin/blogs", label: "日誌管理", icon: BookOpen, group: "content" },
  { href: "/admin/messages", label: "私訊監控", icon: Mail, group: "content" },
  { href: "/admin/chat", label: "即時聊天", icon: MessageCircle, group: "content" },
  { href: "/admin/polls", label: "投票管理", icon: Vote, group: "content" },
  { href: "/admin/tips", label: "打賞紀錄", icon: Heart, group: "content" },
  { href: "/admin/reports", label: "檢舉管理", icon: Flag, group: "content" },
  { href: "/admin/announcements", label: "公告管理", icon: Megaphone, group: "content" },
  { href: "/admin/tags", label: "標籤管理", icon: Hash, group: "content" },

  { href: "/admin/business-ads", label: "業者刊登審核", icon: Building2, group: "business" },
  { href: "/admin/business-ad-comments", label: "業者廣告留言", icon: MessageSquare, group: "business" },
  { href: "/admin/ad-ratings", label: "廣告評分審核", icon: Heart, group: "business" },
  { href: "/admin/business-tags", label: "業者標籤管理", icon: Tags, group: "business" },
  { href: "/admin/business-kyc", label: "業者 KYC 審核", icon: ShieldCheck, group: "business" },
  { href: "/admin/withdrawals", label: "提現審核", icon: Banknote, group: "business" },
  { href: "/admin/wallet-transactions", label: "充值紀錄", icon: Wallet, group: "business" },
  { href: "/admin/coupons", label: "折扣碼", icon: Receipt, group: "business" },
  { href: "/admin/vip-subscribers", label: "VIP 訂閱", icon: Crown, group: "business" },
  { href: "/admin/promotions", label: "推廣訂單", icon: Megaphone, group: "business" },
  { href: "/admin/ads", label: "Banner 廣告", icon: Megaphone, group: "business" },

  { href: "/admin/banned-words", label: "敏感詞", icon: Filter, group: "system" },
  { href: "/admin/levels", label: "等級設定", icon: Award, group: "system" },
  { href: "/admin/downloads", label: "下載資源", icon: Download, group: "system" },
  { href: "/admin/push", label: "推播通知", icon: Bell, group: "system" },
  { href: "/admin/shop", label: "商城管理", icon: Gift, group: "system" },
  { href: "/admin/tasks", label: "任務管理", icon: CheckCircle, group: "system" },
  { href: "/admin/vip", label: "VIP 方案", icon: Star, group: "system" },
  { href: "/admin/platform", label: "平台設定", icon: Settings2, group: "system" },
  { href: "/admin/settings", label: "系統設定", icon: Settings, group: "system" },
  { href: "/admin/logs", label: "操作日誌", icon: ScrollText, group: "system" },
];

const GROUP_LABELS: Record<string, string> = {
  general: "總覽",
  user: "👥 會員",
  content: "📝 內容",
  business: "🏢 業者 / 金流",
  system: "⚙️ 系統",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  // 分組（保持原順序）
  const groups: Array<{ key: string; items: typeof ADMIN_NAV }> = [];
  for (const item of ADMIN_NAV) {
    const existing = groups.find((g) => g.key === item.group);
    if (existing) existing.items.push(item);
    else groups.push({ key: item.group, items: [item] });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card safe-area-pt">
        <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <AdminMobileMenu
              groups={groups.map((g) => ({
                key: g.key,
                label: GROUP_LABELS[g.key] ?? g.key,
                items: g.items.map((i) => ({ href: i.href, label: i.label })),
              }))}
            />
            <Link href="/admin" className="truncate text-base font-bold text-primary sm:text-lg">
              JKF 後台
            </Link>
          </div>
          <div className="flex flex-none items-center gap-2 text-xs sm:gap-4 sm:text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              返回前台
            </Link>
            <span className="hidden text-muted-foreground sm:inline">
              {session.user.name || session.user.username}
            </span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar (lg+) */}
        <aside className="hidden w-60 shrink-0 border-r bg-card lg:block">
          <nav className="space-y-3 p-3">
            {groups.map((g) => (
              <div key={g.key}>
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {GROUP_LABELS[g.key] ?? g.key}
                </p>
                <div className="space-y-0.5">
                  {g.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 p-3 pb-20 sm:p-4 lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
