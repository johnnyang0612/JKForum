"use client";

import { useState, useTransition } from "react";
import { Crown, RefreshCw, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VipBadge } from "./vip-badge";
import { cancelVipAction } from "@/lib/actions/vip-actions";

interface VipStatusProps {
  subscription: {
    id: string;
    plan: string;
    status: string;
    startDate: string;
    endDate: string;
    autoRenew: boolean;
  } | null;
}

const planNames: Record<string, string> = {
  MONTHLY: "���費會員",
  QUARTERLY: "季費會員",
  YEARLY: "年費會員",
};

const statusLabels: Record<string, { label: string; variant: "default" | "success" | "destructive" | "secondary" }> = {
  ACTIVE: { label: "生效中", variant: "success" },
  EXPIRED: { label: "已過期", variant: "secondary" },
  CANCELLED: { label: "已取消", variant: "destructive" },
};

export function VipStatus({ subscription }: VipStatusProps) {
  const [isPending, startTransition] = useTransition();
  const [cancelResult, setCancelResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null);

  if (!subscription) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Crown className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">尚未訂閱 VIP</p>
          <p className="text-sm text-muted-foreground">
            訂閱 VIP 享受專屬權益，提升你的論壇體驗！
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = statusLabels[subscription.status] || statusLabels.EXPIRED;
  const endDate = new Date(subscription.endDate);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  function handleCancel() {
    setCancelResult(null);
    startTransition(async () => {
      const res = await cancelVipAction(subscription!.id);
      setCancelResult(res);
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            我的 VIP 狀態
          </CardTitle>
          <VipBadge plan={subscription.plan} size="lg" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-sm text-muted-foreground">目前方案</p>
            <p className="mt-1 font-semibold">{planNames[subscription.plan] || subscription.plan}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-sm text-muted-foreground">到期日</p>
            <p className="mt-1 font-semibold">
              {endDate.toLocaleDateString("zh-TW")}
            </p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-sm text-muted-foreground">剩餘天數</p>
            <p className="mt-1 font-semibold">
              {daysRemaining > 0 ? `${daysRemaining} 天` : "已到期"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            {subscription.autoRenew && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                自動續訂
              </span>
            )}
          </div>

          {subscription.status === "ACTIVE" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
              className="text-danger hover:text-danger"
            >
              <XCircle className="mr-1 h-4 w-4" />
              {isPending ? "處理中..." : "取消訂閱"}
            </Button>
          )}
        </div>

        {cancelResult?.error && (
          <p className="text-sm text-danger">{cancelResult.error}</p>
        )}
        {cancelResult?.success && (
          <p className="text-sm text-success">{cancelResult.message}</p>
        )}
      </CardContent>
    </Card>
  );
}
