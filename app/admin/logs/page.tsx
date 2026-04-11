import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/pagination";
import { timeAgo } from "@/lib/utils/format";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: "操作日誌" };

interface Props {
  searchParams: { page?: string; action?: string };
}

export default async function AdminLogsPage({ searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 30;
  const actionFilter = searchParams.action;

  const where: Record<string, unknown> = {};
  if (actionFilter) where.action = actionFilter;

  const [logs, total] = await Promise.all([
    db.adminLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        admin: { select: { displayName: true, username: true } },
      },
    }),
    db.adminLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">操作日誌</h1>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium">操作者</th>
              <th className="p-3 text-left font-medium">動作</th>
              <th className="p-3 text-left font-medium">目標</th>
              <th className="p-3 text-left font-medium">詳情</th>
              <th className="p-3 text-left font-medium">時間</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium text-xs">{log.admin.displayName}</td>
                <td className="p-3">
                  <Badge variant="secondary" className="text-xs">{log.action}</Badge>
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {log.targetType} / {log.targetId.slice(0, 8)}...
                </td>
                <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">
                  {log.detail || "-"}
                </td>
                <td className="p-3 text-xs text-muted-foreground">{timeAgo(log.createdAt)}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  暫無操作記錄
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
