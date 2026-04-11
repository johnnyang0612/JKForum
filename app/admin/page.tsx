import { db } from "@/lib/db";
import { Users, FileText, Flag, Crown } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: "管理後台" };

async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    todayPosts,
    pendingReports,
    totalPosts,
    recentUsers,
    recentPosts,
  ] = await Promise.all([
    db.user.count({ where: { status: "ACTIVE" } }),
    db.post.count({ where: { createdAt: { gte: today }, status: "PUBLISHED" } }),
    db.report.count({ where: { status: "PENDING" } }),
    db.post.count({ where: { status: "PUBLISHED" } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, displayName: true, username: true, createdAt: true },
    }),
    db.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, createdAt: true, author: { select: { displayName: true } } },
    }),
  ]);

  return { totalUsers, todayPosts, pendingReports, totalPosts, recentUsers, recentPosts };
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  const statCards = [
    { label: "總會員數", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { label: "今日發文", value: stats.todayPosts, icon: FileText, color: "text-green-500" },
    { label: "待處理檢舉", value: stats.pendingReports, icon: Flag, color: "text-red-500" },
    { label: "總文章數", value: stats.totalPosts, icon: Crown, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">儀表板</h1>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="mt-2 text-3xl font-bold">{formatNumber(card.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent users */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 font-semibold">最近註冊會員</h3>
          <div className="space-y-3">
            {stats.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{user.displayName}</span>
                  <span className="ml-2 text-muted-foreground">@{user.username}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString("zh-TW")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent posts */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 font-semibold">最近發表文章</h3>
          <div className="space-y-3">
            {stats.recentPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0 flex-1">
                  <a href={`/posts/${post.id}`} className="font-medium truncate block hover:text-primary">
                    {post.title}
                  </a>
                  <span className="text-xs text-muted-foreground">{post.author.displayName}</span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground ml-2">
                  {new Date(post.createdAt).toLocaleDateString("zh-TW")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
