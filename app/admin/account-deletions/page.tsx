import Link from "next/link";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "帳號刪除申請" };

export default async function AdminAccountDeletionsPage({
  searchParams,
}: { searchParams: { status?: string; page?: string } }) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 50;
  const status = searchParams.status ?? "pending";

  const now = new Date();
  let where: Record<string, unknown>;
  if (status === "pending") {
    where = { executedAt: null, cancelledAt: null };
  } else if (status === "executed") {
    where = { executedAt: { not: null } };
  } else if (status === "cancelled") {
    where = { cancelledAt: { not: null }, executedAt: null };
  } else {
    where = {};
  }

  const [reqs, total, pendingCount, dueSoonCount, executedCount, cancelledCount] = await Promise.all([
    db.accountDeletionRequest.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.accountDeletionRequest.count({ where }),
    db.accountDeletionRequest.count({ where: { executedAt: null, cancelledAt: null } }),
    db.accountDeletionRequest.count({
      where: {
        executedAt: null, cancelledAt: null,
        scheduledAt: { lte: new Date(now.getTime() + 7 * 24 * 3600 * 1000) },
      },
    }),
    db.accountDeletionRequest.count({ where: { executedAt: { not: null } } }),
    db.accountDeletionRequest.count({ where: { cancelledAt: { not: null }, executedAt: null } }),
  ]);

  const userIds = Array.from(new Set(reqs.map((r) => r.userId)));
  const users = userIds.length > 0
    ? await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, displayName: true, username: true },
      })
    : [];
  const uMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">🗑️ 帳號刪除申請</h1>
        <p className="text-sm text-muted-foreground mt-1">
          待執行：<strong className="text-warning">{pendingCount}</strong> ·
          7 天內到期：<strong className="text-destructive">{dueSoonCount}</strong> ·
          已執行：{executedCount} · 已取消：{cancelledCount}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {(["pending", "executed", "cancelled", "all"] as const).map((s) => (
          <Link key={s} href={`/admin/account-deletions?status=${s}`}
            className={`rounded border px-3 py-1 ${status === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            {{ pending: "待執行", executed: "已執行", cancelled: "已取消", all: "全部" }[s]}
          </Link>
        ))}
      </div>

      <div className="md:overflow-x-auto md:rounded-lg md:border">
        <table className="responsive-table w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-2 text-left">申請時間</th>
              <th className="p-2 text-left">使用者</th>
              <th className="p-2 text-left">原因</th>
              <th className="p-2 text-left">執行時間</th>
              <th className="p-2 text-left">狀態</th>
              <th className="p-2 w-32">操作</th>
            </tr>
          </thead>
          <tbody>
            {reqs.map((r) => {
              const u = uMap[r.userId];
              const isPending = !r.executedAt && !r.cancelledAt;
              const daysLeft = isPending
                ? Math.ceil((r.scheduledAt.getTime() - now.getTime()) / (24 * 3600 * 1000))
                : null;
              return (
                <tr key={r.id} className="border-b hover:bg-muted/20">
                  <td data-label="申請時間" className="p-2 whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString("zh-TW")}
                  </td>
                  <td data-label="使用者" className="p-2">
                    {u ? (
                      <Link href={`/admin/users/${u.id}`} className="text-primary hover:underline">
                        {u.displayName}
                      </Link>
                    ) : <span className="text-muted-foreground">{r.userId.slice(0, 8)} (已刪)</span>}
                    {u && <p className="text-xs text-muted-foreground">{u.email}</p>}
                  </td>
                  <td data-label="原因" className="p-2 max-w-[280px] truncate text-xs text-muted-foreground"
                    title={r.reason ?? ""}>
                    {r.reason || "（未填）"}
                  </td>
                  <td data-label="排定/執行" className="p-2 text-xs">
                    {r.executedAt
                      ? <span className="text-destructive">{new Date(r.executedAt).toLocaleDateString("zh-TW")}</span>
                      : <span>{new Date(r.scheduledAt).toLocaleDateString("zh-TW")}{daysLeft !== null && ` (${daysLeft} 天後)`}</span>}
                  </td>
                  <td data-label="狀態" className="p-2 text-xs">
                    {r.executedAt && <span className="rounded bg-destructive/20 px-1.5 py-0.5 text-destructive">已執行</span>}
                    {!r.executedAt && r.cancelledAt && <span className="rounded bg-muted px-1.5 py-0.5">已取消</span>}
                    {isPending && daysLeft !== null && daysLeft <= 7 && (
                      <span className="rounded bg-warning/20 px-1.5 py-0.5 text-warning">即將到期</span>
                    )}
                    {isPending && daysLeft !== null && daysLeft > 7 && (
                      <span className="rounded bg-muted px-1.5 py-0.5">冷靜期</span>
                    )}
                  </td>
                  <td data-label="操作" className="p-2">
                    {isPending && (
                      <form action={`/api/admin/account-deletions/${r.id}/cancel`} method="POST">
                        <button type="submit"
                          className="rounded border px-3 py-1.5 text-xs hover:bg-muted"
                          onClick={(e) => { if (!confirm("替使用者取消刪除申請？")) e.preventDefault(); }}>
                          取消申請
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {reqs.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">無資料</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 && <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}`} className="rounded border px-3 py-1">上一頁</Link>}
          <span className="px-3 py-1">{page} / {totalPages}</span>
          {page < totalPages && <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`} className="rounded border px-3 py-1">下一頁</Link>}
        </div>
      )}
    </div>
  );
}
