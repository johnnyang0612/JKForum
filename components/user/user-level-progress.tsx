import { getLevelByPoints, getLevelProgress, getPointsToNextLevel } from "@/lib/constants/levels";
import { formatNumber } from "@/lib/utils/format";

interface UserLevelProgressProps {
  totalPoints: number;
}

export function UserLevelProgress({ totalPoints }: UserLevelProgressProps) {
  const currentLevel = getLevelByPoints(totalPoints);
  const progress = getLevelProgress(totalPoints);
  const nextLevelInfo = getPointsToNextLevel(totalPoints);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold" style={{ color: currentLevel.color }}>
          {currentLevel.name}
        </span>
        {nextLevelInfo ? (
          <span className="text-muted-foreground text-xs">
            距離 {nextLevelInfo.nextLevel.name} 還需 {formatNumber(nextLevelInfo.pointsNeeded)} 積分
          </span>
        ) : (
          <span className="text-xs text-yellow-500 font-semibold">最高等級</span>
        )}
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            backgroundColor: currentLevel.color,
          }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatNumber(totalPoints)} 積分</span>
        <span>{progress}%</span>
      </div>
    </div>
  );
}
