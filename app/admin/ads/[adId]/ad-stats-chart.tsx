"use client";

interface AdStatsChartProps {
  impressions: number;
  clicks: number;
  ctr: number;
  elapsedDays: number;
  dailyImpressions: number;
  dailyClicks: number;
}

export function AdStatsChart({
  impressions,
  clicks,
  ctr,
  elapsedDays,
  dailyImpressions,
  dailyClicks,
}: AdStatsChartProps) {
  // 簡易的視覺化長條圖
  const maxVal = Math.max(dailyImpressions, dailyClicks, 1);

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 font-semibold">每日平均表現</h3>

      <div className="space-y-4">
        {/* 曝光長條 */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">日均曝光</span>
            <span className="font-medium tabular-nums">
              {dailyImpressions.toLocaleString()}
            </span>
          </div>
          <div className="h-6 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all flex items-center justify-end pr-2"
              style={{
                width: `${Math.max(5, (dailyImpressions / maxVal) * 100)}%`,
              }}
            >
              <span className="text-[10px] font-medium text-white">
                {dailyImpressions > 0 ? dailyImpressions.toLocaleString() : ""}
              </span>
            </div>
          </div>
        </div>

        {/* 點擊長條 */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">��均點擊</span>
            <span className="font-medium tabular-nums">
              {dailyClicks.toLocaleString()}
            </span>
          </div>
          <div className="h-6 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all flex items-center justify-end pr-2"
              style={{
                width: `${Math.max(5, (dailyClicks / maxVal) * 100)}%`,
              }}
            >
              <span className="text-[10px] font-medium text-white">
                {dailyClicks > 0 ? dailyClicks.toLocaleString() : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 摘要 */}
      <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">總曝光</p>
          <p className="text-sm font-bold">{impressions.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">總點擊</p>
          <p className="text-sm font-bold">{clicks.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">CTR</p>
          <p className="text-sm font-bold">{ctr}%</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground text-center">
        投放天數���{elapsedDays} 天
      </p>
    </div>
  );
}
