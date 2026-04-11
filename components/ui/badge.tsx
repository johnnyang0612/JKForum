import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

const badgeVariants = {
  default: "bg-primary/10 text-primary",
  secondary: "bg-muted text-muted-foreground",
  destructive: "bg-danger/10 text-danger",
  outline: "border text-foreground",
  success: "bg-success/10 text-success",
} as const;

export interface BadgeProps {
  children: ReactNode;
  variant?: keyof typeof badgeVariants;
  className?: string;
}

function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
