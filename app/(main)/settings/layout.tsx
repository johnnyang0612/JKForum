import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { User, Lock, Bell, Eye, ShieldCheck, Ban, Trash2 } from "lucide-react";

export const dynamic = 'force-dynamic';

const NAV_ITEMS = [
  { href: "/settings/profile", label: "個人資料", icon: User },
  { href: "/settings/account", label: "帳號安全", icon: Lock },
  { href: "/settings/mfa", label: "雙因素認證", icon: ShieldCheck },
  { href: "/settings/notifications", label: "通知設定", icon: Bell },
  { href: "/settings/privacy", label: "隱私設定", icon: Eye },
  { href: "/settings/blocked", label: "封鎖名單", icon: Ban },
  { href: "/settings/danger-zone", label: "危險區", icon: Trash2 },
];

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="mt-1 text-muted-foreground">管理你的帳號與偏好設定</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar nav */}
        <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-x-visible">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors whitespace-nowrap"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Content */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
