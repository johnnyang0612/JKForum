import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import {
  LayoutDashboard, Users, MessageSquare, FileText,
  Flag, Award, Settings, ScrollText, Megaphone,
  Gift, CheckCircle, Star,
} from "lucide-react";

export const dynamic = 'force-dynamic';

const ADMIN_NAV = [
  { href: "/admin", label: "儀表板", icon: LayoutDashboard },
  { href: "/admin/users", label: "用戶管理", icon: Users },
  { href: "/admin/forums", label: "看板管理", icon: MessageSquare },
  { href: "/admin/posts", label: "文章管理", icon: FileText },
  { href: "/admin/reports", label: "檢舉管理", icon: Flag },
  { href: "/admin/levels", label: "等級設定", icon: Award },
  { href: "/admin/ads", label: "廣告管理", icon: Megaphone },
  { href: "/admin/shop", label: "商城管理", icon: Gift },
  { href: "/admin/tasks", label: "任務管理", icon: CheckCircle },
  { href: "/admin/vip", label: "VIP 管理", icon: Star },
  { href: "/admin/settings", label: "系統設定", icon: Settings },
  { href: "/admin/logs", label: "操作日誌", icon: ScrollText },
];

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

  return (
    <div className="min-h-screen bg-background">
      {/* Admin header */}
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-lg font-bold text-primary">
              JKForum 管理後台
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              返回前台
            </Link>
            <span className="text-sm text-muted-foreground">
              {session.user.name || session.user.username}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile nav (only below lg) */}
      <div className="lg:hidden border-b bg-card overflow-x-auto">
        <nav className="flex gap-1 p-2">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted whitespace-nowrap"
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 border-r bg-card lg:block">
          <nav className="space-y-1 p-4">
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
