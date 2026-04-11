import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/pagination";
import { timeAgo } from "@/lib/utils/format";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: "檢舉管理" };

interface Props {
  searchParams: { page?: string; status?: string };
}

export default async function AdminReportsPage({ searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 20;
  const statusFilter = searchParams.status || "PENDING";

  const where: Record<string, unknown> = {};
  if (statusFilter && statusFilter !== "all") {
    where.status = statusFilter;
  }

  const [reports, total] = await Promise.all([
    db.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        reporter: { select: { displayName: true, username: true } },
      },
    }),
    db.report.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "success"> = {
    PENDING: "default",
    REVIEWING: "secondary",
    RESOLVED: "success",
    DISMISSED: "secondary",
  };

  const TYPE_LABELS: Record<string, string> = {
    PORNOGRAPHY: "色情內容",
    VIOLENCE: "暴力內容",
    SPAM: "垃圾訊息",
    HARASSMENT: "騷擾行為",
    MISINFORMATION: "不實資訊",
    OTHER: "其他",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">檢舉管理</h1>

      {/* Status filter */}
      <div className="flex gap-2">
        {["PENDING", "REVIEWING", "RESOLVED", "DISMISSED", "all"].map((s) => (
          <Link
            key={s}
            href={`/admin/reports?status=${s}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? "全部" : s}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium">類型</th>
              <th className="p-3 text-left font-medium">目標</th>
              <th className="p-3 text-left font-medium">分類</th>
              <th className="p-3 text-left font-medium">檢舉者</th>
              <th className="p-3 text-left font-medium">狀態</th>
              <th className="p-3 text-left font-medium">時間</th>
              <th className="p-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b hover:bg-muted/30">
                <td className="p-3">{report.targetType}</td>
                <td className="p-3 text-xs text-muted-foreground">{report.targetId.slice(0, 8)}...</td>
                <td className="p-3">
                  <Badge variant="secondary">{TYPE_LABELS[report.type] || report.type}</Badge>
                </td>
                <td className="p-3 text-xs">{report.reporter.displayName}</td>
                <td className="p-3">
                  <Badge variant={STATUS_COLORS[report.status] || "secondary"}>{report.status}</Badge>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{timeAgo(report.createdAt)}</td>
                <td className="p-3">
                  <Link href={`/admin/reports/${report.id}`} className="text-primary hover:underline text-xs">
                    處理
                  </Link>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  {statusFilter === "PENDING" ? "沒有待處理的檢舉" : "無檢舉記錄"}
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
