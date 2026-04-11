import { Crown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface VipBadgeProps {
  plan?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const planLabels: Record<string, string> = {
  MONTHLY: "VIP",
  QUARTERLY: "VIP+",
  YEARLY: "SVIP",
};

const planColors: Record<string, string> = {
  MONTHLY: "bg-amber-100 text-amber-700 border-amber-200",
  QUARTERLY: "bg-violet-100 text-violet-700 border-violet-200",
  YEARLY: "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-300",
};

const sizeClasses = {
  sm: "px-1.5 py-0.5 text-[10px] gap-0.5",
  md: "px-2 py-0.5 text-xs gap-1",
  lg: "px-2.5 py-1 text-sm gap-1",
};

const iconSizes = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

export function VipBadge({ plan, size = "md", className }: VipBadgeProps) {
  if (!plan) return null;

  const label = planLabels[plan] || "VIP";
  const colorClass = planColors[plan] || planColors.MONTHLY;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-bold",
        sizeClasses[size],
        colorClass,
        className
      )}
    >
      <Crown className={iconSizes[size]} />
      {label}
    </span>
  );
}
