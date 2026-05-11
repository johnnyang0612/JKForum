import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotificationList } from "@/components/notification/notification-list";
import { NotificationBulkActions } from "@/components/notification/notification-bulk-actions";
import { Pagination } from "@/components/shared/pagination";
import { SITE_CONFIG } from "@/lib/constants/config";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import type { Metadata } from "next";
import type { NotificationType } from "@prisma/client";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: "通知" };

interface Props {
  searchParams: { page?: string; filter?: string; type?: string };
}

const TYPE_TABS: Array<{ key: NotificationType | "ALL"; label: string }> = [
  { key: "ALL", label: "全部類型" },
  { key: "REPLY", label: "回覆" },
  { key: "LIKE", label: "讚" },
  { key: "FOLLOW", label: "追蹤" },
  { key: "MENTION", label: "@提及" },
  { key: "SYSTEM", label: "系統" },
  { key: "REPORT_RESULT", label: "檢舉結果" },
  { key: "LEVEL_UP", label: "升級" },
  { key: "ACHIEVEMENT", label: "成就" },
];

export default async function NotificationsPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const filter = searchParams.filter || "all";
  const typeFilter = searchParams.type && TYPE_TABS.some((t) => t.key === searchParams.type)
    ? searchParams.type
    : "ALL";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = SITE_CONFIG.notificationsPerPage;

  const where: Record<string, unknown> = { recipientId: session.user.id };
  if (filter === "unread") where.isRead = false;
  if (typeFilter !== "ALL") where.type = typeFilter as NotificationType;

  const [notifications, total, unreadCount, totalAllCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.notification.count({ where }),
    db.notification.count({
      where: { recipientId: session.user.id, isRead: false },
    }),
    db.notification.count({ where: { recipientId: session.user.id } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  function tabHref(t: { key: string }) {
    const p = new URLSearchParams();
    p.set("filter", filter);
    if (t.key !== "ALL") p.set("type", t.key);
    return `/notifications?${p.toString()}`;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">通知</h1>
        {unreadCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {unreadCount} / {totalAllCount} 未讀
          </span>
        )}
      </div>

      {/* read filter */}
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
        {[
          { value: "all", label: "全部" },
          { value: "unread", label: "未讀" },
        ].map((tab) => {
          const p = new URLSearchParams();
          p.set("filter", tab.value);
          if (typeFilter !== "ALL") p.set("type", typeFilter);
          return (
            <Link key={tab.value} href={`/notifications?${p.toString()}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors min-h-[36px] flex items-center",
                filter === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}>
              {tab.label}
            </Link>
          );
        })}

        <div className="ml-auto">
          <NotificationBulkActions hasUnread={unreadCount > 0} />
        </div>
      </div>

      {/* type filter */}
      <div className="-mx-3 flex gap-1 overflow-x-auto px-3 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] text-xs">
        {TYPE_TABS.map((t) => (
          <Link key={t.key} href={tabHref(t)}
            className={cn(
              "rounded-full border px-3 py-1.5 whitespace-nowrap transition-colors min-h-[36px] flex items-center",
              typeFilter === t.key
                ? "border-primary bg-primary/10 text-primary"
                : "hover:bg-muted"
            )}>
            {t.label}
          </Link>
        ))}
      </div>

      <NotificationList
        notifications={notifications}
        hasUnread={unreadCount > 0}
      />

      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
