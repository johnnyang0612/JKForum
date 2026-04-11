import { cn } from "@/lib/utils/cn";
import { getLevelByIndex } from "@/lib/constants/levels";

interface UserBadgeProps {
  level: number;
  className?: string;
}

export function UserBadge({ level, className }: UserBadgeProps) {
  const levelDef = getLevelByIndex(level);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold",
        className
      )}
      style={{
        color: levelDef.color,
        backgroundColor: `${levelDef.color}15`,
        borderColor: `${levelDef.color}30`,
      }}
    >
      {levelDef.name}
    </span>
  );
}
