import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";

interface UserAvatarProps {
  src?: string | null;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl";
  isOnline?: boolean;
  className?: string;
}

export function UserAvatar({ src, fallback, size = "md", isOnline, className }: UserAvatarProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      <Avatar src={src} fallback={fallback} size={size} />
      {isOnline !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full border-2 border-card",
            isOnline ? "bg-success" : "bg-muted-foreground",
            size === "sm" && "h-2.5 w-2.5",
            size === "md" && "h-3 w-3",
            size === "lg" && "h-3.5 w-3.5",
            size === "xl" && "h-4 w-4"
          )}
        />
      )}
    </div>
  );
}
