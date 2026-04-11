import { cn } from "@/lib/utils/cn";
import { AlertCircle, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { ReactNode } from "react";

const alertVariants = {
  info: {
    container: "border-primary/30 bg-primary/5 text-primary",
    icon: AlertCircle,
  },
  success: {
    container: "border-success/30 bg-success/5 text-success",
    icon: CheckCircle2,
  },
  warning: {
    container: "border-warning/30 bg-warning/5 text-warning",
    icon: AlertTriangle,
  },
  error: {
    container: "border-danger/30 bg-danger/5 text-danger",
    icon: XCircle,
  },
} as const;

export interface AlertProps {
  variant?: keyof typeof alertVariants;
  title?: string;
  children: ReactNode;
  className?: string;
}

function Alert({ variant = "info", title, children, className }: AlertProps) {
  const { container, icon: Icon } = alertVariants[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-lg border p-4",
        container,
        className
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1">
        {title && (
          <h5 className="mb-1 font-medium leading-none">{title}</h5>
        )}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
}

export { Alert };
