import Link from "next/link";
import { db } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/pagination";
import { ROLE_DISPLAY_NAMES } from "@/lib/constants/roles";
import { formatDate } from "@/lib/utils/format";
import { BulkUserActions } from "@/components/admin/bulk-user-actions";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: "用戶管理" };

interface Props {
  searchParams: { page?: string; q?: string; role?: string; status?: string; segment?: string };
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 20;
  const query = searchParams.q?.trim();
  const roleFilter = searchParams.role;
  const statusFilter = searchParams.status;
  const segment = searchParams.segment;

  const where: Record<string, unknown> = {};
  if (query) {
    where.OR = [
      { username: { contains: query, mode: "insensitive" } },
      { displayName: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ];
  }
  if (roleFilter) where.role = roleFilter;
  if (statusFilter) where.status = statusFilter;

  // V1.1 用戶分群
  switch (segment) {
    case "new7":
      where.createdAt = { gte: new Date(Date.now() - 7 * 86400000) };
      break;
    case "active7":
      where.lastLoginAt = { gte: new Date(Date.now() - 7 * 86400000) };
      break;
    case "inactive30":
      where.OR = [
        { lastLoginAt: { lt: new Date(Date.now() - 30 * 86400000) } },
        { lastLoginAt: null },
      ];
      break;
    case "business":
      where.userType = "BUSINESS";
      break;
    case "verified":
      where.userType = "BUSINESS";
      where.merchantVerified = true;
      break;
    case "unverified":
      where.smsVerified = null;
      where.emailVerified = null;
      break;
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        profile: { select: { avatarUrl: true } },
        points: { select: { level: true } },
      },
    }),
    db.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const STATUS_BADGES: Record<string, "default" | "destructive" | "secondary" | "success"> = {
    ACTIVE: "success",
    MUTED: "secondary",
    BANNED: "destructive",
    SUSPENDED: "destructive",
    DELETED: "secondary",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">用戶管理</h1>
        <span className="text-sm text-muted-foreground">共 {total} 位用戶</span>
      </div>

      {/* Search + 分群 */}
      <form className="flex flex-wrap gap-2" method="GET">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="搜尋用戶名、顯示名稱、Email..."
          className="flex-1 min-w-48 h-10 rounded-md border bg-background px-3 text-sm"
        />
        <select name="segment" defaultValue={segment ?? ""}
          className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">所有用戶</option>
          <option value="new7">📅 7 天內新註冊</option>
          <option value="active7">🟢 週活躍</option>
          <option value="inactive30">😴 30 天未登入</option>
          <option value="business">🏢 業者</option>
          <option value="verified">✓ 已認證業者</option>
          <option value="unverified">⚠️ 未驗證</option>
        </select>
        <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-white">
          篩選
        </button>
      </form>

      <BulkUserActions userIds={users.map(u => u.id)} />

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium w-8"><input type="checkbox" data-bulk-toggle-all /></th>
              <th className="p-3 text-left font-medium">用戶</th>
              <th className="p-3 text-left font-medium">Email</th>
              <th className="p-3 text-left font-medium">角色</th>
              <th className="p-3 text-left font-medium">狀態</th>
              <th className="p-3 text-left font-medium">加入時間</th>
              <th className="p-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-muted/30">
                <td className="p-3">
                  <input type="checkbox" name="bulk-user" value={user.id} data-bulk-item />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={user.profile?.avatarUrl}
                      fallback={user.displayName}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{user.email}</td>
                <td className="p-3">
                  <Badge variant="secondary">{ROLE_DISPLAY_NAMES[user.role]}</Badge>
                </td>
                <td className="p-3">
                  <Badge variant={STATUS_BADGES[user.status] || "secondary"}>
                    {user.status}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground text-xs">
                  {formatDate(user.createdAt)}
                </td>
                <td className="p-3">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-primary hover:underline text-xs"
                  >
                    管理
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
