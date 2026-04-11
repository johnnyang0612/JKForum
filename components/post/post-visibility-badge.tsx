import { Badge } from "@/components/ui/badge";
import { Lock, Eye, Crown, EyeOff } from "lucide-react";

const VISIBILITY_CONFIG: Record<string, {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline" | "success";
  icon: React.ElementType;
}> = {
  PUBLIC: { label: "公開", variant: "secondary", icon: Eye },
  REPLY_TO_VIEW: { label: "回覆可見", variant: "outline", icon: Lock },
  PAID: { label: "付費內容", variant: "default", icon: Lock },
  VIP_ONLY: { label: "VIP 限定", variant: "success", icon: Crown },
  PRIVATE: { label: "私密", variant: "destructive", icon: EyeOff },
};

interface PostVisibilityBadgeProps {
  visibility: string;
  showPublic?: boolean;
  className?: string;
}

export function PostVisibilityBadge({
  visibility,
  showPublic = false,
  className,
}: PostVisibilityBadgeProps) {
  if (visibility === "PUBLIC" && !showPublic) return null;

  const config = VISIBILITY_CONFIG[visibility];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}
