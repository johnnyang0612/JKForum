import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotificationList } from "@/components/notification/notification-list";
import { Pagination } from "@/components/shared/pagination";
import { SITE_CONFIG } from "@/lib/constants/config";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: "通知" };

interface Props {
  searchParams: { page?: string; filter?: string };
}

export default async function NotificationsPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const filter = searchParams.filter || "all";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = SITE_CONFIG.notificationsPerPage;

  const where = {
    recipientId: session.user.id,
    ...(filter === "unread" ? { isRead: false } : {}),
  };

  const [notifications, total, unreadCount] = await Promise.all([
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
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">通知</h1>
        {unreadCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {unreadCount} 則未讀
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
        {[
          { value: "all", label: "全部" },
          { value: "unread", label: "未讀" },
        ].map((tab) => (
          <Link
            key={tab.value}
            href={`/notifications?filter=${tab.value}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              filter === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
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
