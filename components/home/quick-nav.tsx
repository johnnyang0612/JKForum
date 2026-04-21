import Link from "next/link";
import {
  Flame,
  Clock,
  MessageSquare,
  FileText,
  Gift,
  Users,
  Star,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";

interface QuickNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  bg: string;
}

const ITEMS: QuickNavItem[] = [
  { label: "熱門", href: "/hot", icon: Flame, bg: "bg-orange-500" },
  { label: "最新", href: "/latest", icon: Clock, bg: "bg-blue-500" },
  { label: "看板", href: "/forums", icon: MessageSquare, bg: "bg-emerald-500" },
  { label: "發文", href: "/posts/new", icon: FileText, bg: "bg-violet-500" },
  { label: "任務", href: "/tasks", icon: CheckCircle, bg: "bg-rose-500" },
  { label: "商城", href: "/shop", icon: Gift, bg: "bg-pink-500" },
  { label: "VIP", href: "/vip", icon: Star, bg: "bg-amber-500" },
  { label: "會員", href: "/register", icon: Users, bg: "bg-cyan-500" },
];

export function QuickNav() {
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-8 sm:gap-4">
      {ITEMS.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="group flex flex-col items-center gap-2 rounded-xl p-2 transition-colors hover:bg-muted"
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md transition-transform group-hover:scale-110 sm:h-14 sm:w-14 ${it.bg}`}
          >
            <it.icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <span className="text-xs font-medium text-foreground sm:text-sm">
            {it.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
