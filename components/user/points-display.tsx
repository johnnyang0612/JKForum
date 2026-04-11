import { Award, Coins, Gem } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";

interface PointsDisplayProps {
  reputation: number;
  coins: number;
  platinum: number;
  compact?: boolean;
}

export function PointsDisplay({ reputation, coins, platinum, compact = false }: PointsDisplayProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1" title="名聲">
          <Award className="h-3 w-3 text-blue-500" />
          {formatNumber(reputation)}
        </span>
        <span className="flex items-center gap-1" title="金幣">
          <Coins className="h-3 w-3 text-yellow-500" />
          {formatNumber(coins)}
        </span>
        <span className="flex items-center gap-1" title="白金幣">
          <Gem className="h-3 w-3 text-purple-500" />
          {formatNumber(platinum)}
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="flex flex-col items-center gap-1 rounded-lg border bg-card p-3">
        <Award className="h-5 w-5 text-blue-500" />
        <span className="text-lg font-bold">{formatNumber(reputation)}</span>
        <span className="text-xs text-muted-foreground">名聲</span>
      </div>
      <div className="flex flex-col items-center gap-1 rounded-lg border bg-card p-3">
        <Coins className="h-5 w-5 text-yellow-500" />
        <span className="text-lg font-bold">{formatNumber(coins)}</span>
        <span className="text-xs text-muted-foreground">金幣</span>
      </div>
      <div className="flex flex-col items-center gap-1 rounded-lg border bg-card p-3">
        <Gem className="h-5 w-5 text-purple-500" />
        <span className="text-lg font-bold">{formatNumber(platinum)}</span>
        <span className="text-xs text-muted-foreground">白金幣</span>
      </div>
    </div>
  );
}
