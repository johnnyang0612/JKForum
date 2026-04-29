"use client";

import { useMemo } from "react";

interface Props {
  title: string;
  color: string;
  data: { x: string; y: number }[];
  height?: number;
}

/**
 * 純 SVG sparkline + 數值卡片，無第三方依賴
 */
export function TrendChart({ title, color, data, height = 80 }: Props) {
  const { path, max, total, growth, areaPath } = useMemo(() => {
    if (data.length === 0)
      return { path: "", max: 0, total: 0, growth: 0, areaPath: "" };
    const max = Math.max(...data.map((d) => d.y), 1);
    const w = 300;
    const h = height;
    const stepX = w / (data.length - 1 || 1);
    const points = data.map((d, i) => {
      const x = i * stepX;
      const y = h - (d.y / max) * h * 0.85 - h * 0.075;
      return [x, y];
    });
    const path = points
      .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
      .join(" ");
    const areaPath = `${path} L${points[points.length - 1][0]},${h} L0,${h} Z`;
    const total = data.reduce((s, d) => s + d.y, 0);
    const half = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, half).reduce((s, d) => s + d.y, 0);
    const secondHalf = data.slice(half).reduce((s, d) => s + d.y, 0);
    const growth =
      firstHalf === 0
        ? secondHalf > 0
          ? 100
          : 0
        : ((secondHalf - firstHalf) / firstHalf) * 100;
    return { path, max, total, growth, areaPath };
  }, [data, height]);

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        <span
          className={`text-xs font-bold ${
            growth > 0 ? "text-emerald-400" : growth < 0 ? "text-rose-400" : "text-muted-foreground"
          }`}
        >
          {growth > 0 ? "↑" : growth < 0 ? "↓" : ""} {Math.abs(growth).toFixed(0)}%
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold">{total.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground">{data.length} 天 · 峰值 {max}</span>
      </div>
      <svg
        className="mt-2 w-full"
        viewBox={`0 0 300 ${height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {areaPath && (
          <path
            d={areaPath}
            fill={`url(#grad-${color.replace("#", "")})`}
          />
        )}
        {path && (
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
}
