import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  LayoutDashboard, Megaphone, Wallet, BarChart3, Banknote, Settings, ArrowLeft,
} from "lucide-react";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/business",            label: "儀表板",      icon: LayoutDashboard },
  { href: "/business/ads",        label: "我的廣告",    icon: Megaphone },
  { href: "/business/wallet",     label: "錢包儲值",    icon: Wallet },
  { href: "/business/analytics",  label: "成效分析",    icon: BarChart3 },
  { href: "/business/withdraw",   label: "提現申請",    icon: Banknote },
  { href: "/business/settings",   label: "業者設定",    icon: Settings },
];

export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/business");

  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { userType: true, merchantName: true, displayName: true },
  });
  if (me?.userType !== "BUSINESS" && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/business/upgrade");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" />
              返回前台
            </Link>
            <Link href="/business" className="text-base font-bold text-primary sm:text-lg">
              🏢 業者後台
            </Link>
          </div>
          <span className="truncate text-xs text-muted-foreground sm:text-sm">
            {me?.merchantName ?? me?.displayName}
          </span>
        </div>
      </header>

      {/* Mobile horizontal nav */}
      <div className="lg:hidden border-b bg-card overflow-x-auto">
        <nav className="flex gap-1 p-2">
          {NAV.map((item) => (
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
        <aside className="hidden w-56 shrink-0 border-r bg-card lg:block">
          <nav className="space-y-1 p-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
