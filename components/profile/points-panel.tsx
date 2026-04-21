import { Trophy, Coins, Sparkles, Heart, Gem, Send, Battery, Mail } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";

export interface PointsData {
  reputation: number;
  coins: number;
  platinum: number;
  hearts: number;
  gems: number;
  given: number;
  energy: number;
  invites: number;
  totalPoints: number;
}

const POINT_ITEMS: Array<{
  key: keyof PointsData;
  label: string;
  icon: typeof Trophy;
  color: string;
  bg: string;
  max?: number;
}> = [
  { key: "reputation", label: "名聲", icon: Trophy, color: "text-red-500", bg: "bg-red-500/10" },
  { key: "coins", label: "金幣", icon: Coins, color: "text-amber-500", bg: "bg-amber-500/10" },
  { key: "platinum", label: "白金幣", icon: Sparkles, color: "text-sky-500", bg: "bg-sky-500/10" },
  { key: "hearts", label: "愛心", icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" },
  { key: "gems", label: "寶石", icon: Gem, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { key: "given", label: "送出", icon: Send, color: "text-pink-500", bg: "bg-pink-500/10" },
  { key: "energy", label: "體力", icon: Battery, color: "text-violet-500", bg: "bg-violet-500/10", max: 100 },
  { key: "invites", label: "邀請", icon: Mail, color: "text-cyan-500", bg: "bg-cyan-500/10" },
];

export function PointsPanel({ points }: { points: PointsData }) {
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">積分</h3>
        <div className="text-sm text-muted-foreground">
          總積分{" "}
          <span className="font-bold text-foreground">
            {formatNumber(points.totalPoints)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {POINT_ITEMS.map((it) => {
          const val = points[it.key] as number;
          const max = it.max;
          return (
            <div
              key={it.key}
              className="flex items-center gap-3 rounded-lg border bg-background p-3 transition-colors hover:bg-muted/30"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${it.bg}`}>
                <it.icon className={`h-5 w-5 ${it.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">{it.label}</div>
                <div className="font-bold">
                  {formatNumber(val)}
                  {max != null && (
                    <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                      / {max}
                    </span>
                  )}
                </div>
                {max != null && (
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${it.color.replace("text-", "bg-")}`}
                      style={{ width: `${Math.min(100, (val / max) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
