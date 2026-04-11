import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getAdStats } from "@/lib/services/ad-service";
import { AdForm } from "../ad-form";
import { AdStatsChart } from "./ad-stats-chart";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "���輯廣告" };

interface Props {
  params: { adId: string };
}

export default async function EditAdPage({ params }: Props) {
  const [ad, forums, stats] = await Promise.all([
    db.advertisement.findUnique({ where: { id: params.adId } }),
    db.forum.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    getAdStats(params.adId),
  ]);

  if (!ad) notFound();

  const initialData = {
    id: ad.id,
    title: ad.title,
    imageUrl: ad.imageUrl,
    linkUrl: ad.linkUrl,
    position: ad.position,
    width: ad.width,
    height: ad.height,
    startDate: ad.startDate.toISOString().slice(0, 16),
    endDate: ad.endDate.toISOString().slice(0, 16),
    isActive: ad.isActive,
    priority: ad.priority,
    targetForums: ad.targetForums,
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">編輯廣告</h1>

      {/* 統計��料 */}
      {stats && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">成效統計</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">總曝光數</p>
              <p className="mt-1 text-2xl font-bold">
                {stats.impressions.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                平均 {stats.dailyImpressions.toLocaleString()}/天
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">總點擊數</p>
              <p className="mt-1 text-2xl font-bold">
                {stats.clicks.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ���均 {stats.dailyClicks.toLocaleString()}/天
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">點擊率 (CTR)</p>
              <p className="mt-1 text-2xl font-bold">{stats.ctr}%</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">投放進度</p>
              <p className="mt-1 text-2xl font-bold">
                {stats.elapsedDays}/{stats.totalDays} 天
              </p>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(100, (stats.elapsedDays / stats.totalDays) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <AdStatsChart
            impressions={stats.impressions}
            clicks={stats.clicks}
            ctr={stats.ctr}
            elapsedDays={stats.elapsedDays}
            dailyImpressions={stats.dailyImpressions}
            dailyClicks={stats.dailyClicks}
          />
        </div>
      )}

      {/* 編輯表單 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">廣告設定</h2>
        <AdForm forums={forums} initialData={initialData} />
      </div>
    </div>
  );
}
