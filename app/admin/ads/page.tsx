import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/pagination";
import { formatDate } from "@/lib/utils/format";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { AdStatusToggle } from "./ad-status-toggle";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "廣告管理" };

const POSITION_LABELS: Record<string, string> = {
  HOME_BANNER: "首頁橫幅",
  SIDEBAR: "側邊欄",
  POST_INLINE: "文章穿插",
  OVERLAY: "蓋版廣告",
  POPUP: "彈出式",
};

interface Props {
  searchParams: { page?: string; position?: string };
}

export default async function AdminAdsPage({ searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 20;
  const positionFilter = searchParams.position;

  const where: Record<string, unknown> = {};
  if (positionFilter) {
    where.position = positionFilter;
  }

  const [ads, total] = await Promise.all([
    db.advertisement.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.advertisement.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">廣告管理</h1>
        <Link
          href="/admin/ads/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新增廣告
        </Link>
      </div>

      {/* 篩選 */}
      <form className="flex gap-2" method="GET">
        <select
          name="position"
          defaultValue={positionFilter || ""}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">所有位置</option>
          <option value="HOME_BANNER">首頁橫幅</option>
          <option value="SIDEBAR">側邊欄</option>
          <option value="POST_INLINE">文章穿插</option>
          <option value="OVERLAY">蓋版廣告</option>
          <option value="POPUP">彈出式</option>
        </select>
        <button
          type="submit"
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-white"
        >
          篩選
        </button>
      </form>

      {/* 廣告列表 */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium">標題</th>
              <th className="p-3 text-left font-medium">位置</th>
              <th className="p-3 text-left font-medium">開始日期</th>
              <th className="p-3 text-left font-medium">結束日期</th>
              <th className="p-3 text-left font-medium">狀態</th>
              <th className="p-3 text-right font-medium">曝光</th>
              <th className="p-3 text-right font-medium">點擊</th>
              <th className="p-3 text-right font-medium">CTR</th>
              <th className="p-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {ads.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  尚無廣告資料
                </td>
              </tr>
            )}
            {ads.map((ad) => {
              const isExpired = ad.endDate < now;
              const isNotStarted = ad.startDate > now;
              const ctr =
                ad.impressions > 0
                  ? ((ad.clicks / ad.impressions) * 100).toFixed(2)
                  : "0.00";

              let statusLabel = "進行中";
              let statusVariant: "default" | "secondary" | "destructive" | "success" =
                "success";
              if (!ad.isActive) {
                statusLabel = "已停用";
                statusVariant = "secondary";
              } else if (isExpired) {
                statusLabel = "已過期";
                statusVariant = "destructive";
              } else if (isNotStarted) {
                statusLabel = "排程中";
                statusVariant = "default";
              }

              return (
                <tr key={ad.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 max-w-[180px]">
                    <p className="font-medium truncate">{ad.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      優先級：{ad.priority}
                    </p>
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary">
                      {POSITION_LABELS[ad.position] || ad.position}
                    </Badge>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(ad.startDate)}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(ad.endDate)}
                  </td>
                  <td className="p-3">
                    <Badge variant={statusVariant}>{statusLabel}</Badge>
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {ad.impressions.toLocaleString()}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {ad.clicks.toLocaleString()}
                  </td>
                  <td className="p-3 text-right tabular-nums">{ctr}%</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/ads/${ad.id}`}
                        className="text-primary hover:underline text-xs"
                      >
                        編輯
                      </Link>
                      <AdStatusToggle adId={ad.id} isActive={ad.isActive} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
