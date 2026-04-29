/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { db } from "@/lib/db";
import { GROUPS } from "@/lib/user-groups";
import { UserGroupRow } from "@/components/admin/user-group-row";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "會員組管理" };

interface Props {
  searchParams: { q?: string; group?: string; page?: string };
}

export default async function AdminUserGroupsPage({ searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 30;
  const q = searchParams.q?.trim();
  const groupFilter = searchParams.group as any;

  const where: any = {};
  if (q) {
    where.OR = [
      { username: { contains: q, mode: "insensitive" } },
      { displayName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (groupFilter && GROUPS.find((g) => g.group === groupFilter)) {
    where.userGroup = groupFilter;
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: [{ readPermission: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        userGroup: true,
        readPermission: true,
        role: true,
        profile: { select: { postCount: true, replyCount: true } },
      },
    }),
    db.user.count({ where }),
  ]);
  const totalPages = Math.ceil(total / limit);

  // 各 group 人數統計
  const groupCounts = await db.user.groupBy({
    by: ["userGroup"],
    _count: { userGroup: true },
  });
  const countMap = new Map(groupCounts.map((g) => [g.userGroup, g._count.userGroup]));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">會員組管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          手動指派 18 層會員組（VIP 由訂閱觸發；版主 / 站長由此指派）
        </p>
      </header>

      {/* 統計卡 */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-9">
        {GROUPS.map((g) => (
          <Link
            key={g.group}
            href={`/admin/user-groups?group=${g.group}`}
            className="rounded-lg border bg-card px-3 py-2 text-center transition hover:border-primary"
          >
            <div className="text-2xl">{g.iconEmoji}</div>
            <div className="text-xs">{g.label}</div>
            <div className="mt-0.5 text-xs font-bold">{countMap.get(g.group) ?? 0}</div>
          </Link>
        ))}
      </div>

      {/* 篩選 */}
      <form className="flex gap-2" action="/admin/user-groups">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="搜尋 username / email / 暱稱"
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
        />
        <select
          name="group"
          defaultValue={groupFilter ?? ""}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">全部群組</option>
          {GROUPS.map((g) => (
            <option key={g.group} value={g.group}>
              {g.iconEmoji} {g.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          篩選
        </button>
      </form>

      {/* 列表 */}
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">用戶</th>
              <th className="px-3 py-2 text-right">發文 / 回覆</th>
              <th className="px-3 py-2 text-center">目前群組</th>
              <th className="px-3 py-2 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserGroupRow key={u.id} user={u as any} />
            ))}
          </tbody>
        </table>
      </div>

      {/* 分頁 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          共 {total} 位用戶，第 {page}/{totalPages} 頁
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={`/admin/user-groups?page=${page - 1}${q ? `&q=${q}` : ""}${groupFilter ? `&group=${groupFilter}` : ""}`}
              className="rounded border px-3 py-1.5"
            >
              上一頁
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={`/admin/user-groups?page=${page + 1}${q ? `&q=${q}` : ""}${groupFilter ? `&group=${groupFilter}` : ""}`}
              className="rounded border px-3 py-1.5"
            >
              下一頁
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
