"use client";

import { useState, useTransition } from "react";
import { Package, Clock, Check, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useItemAction as itemAction } from "@/lib/actions/shop-actions";

interface UserItemData {
  id: string;
  quantity: number;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  item: {
    id: string;
    name: string;
    description: string | null;
    type: string;
    effect: string | null;
    duration: number | null;
  };
}

interface InventoryListProps {
  items: UserItemData[];
}

export function InventoryList({ items }: InventoryListProps) {
  const [isPending, startTransition] = useTransition();
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [result, setResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null);

  function handleUse(userItemId: string) {
    setActiveItemId(userItemId);
    setResult(null);
    startTransition(async () => {
      const res = await itemAction(userItemId);
      setResult(res);
      setActiveItemId(null);
    });
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <Package className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">背包是空的</p>
          <p className="text-sm text-muted-foreground">去商城逛逛，購買你喜歡���道具吧！</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {result?.error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
          {result.error}
        </div>
      )}
      {result?.success && (
        <div className="rounded-lg border border-success/20 bg-success/5 p-3 text-sm text-success">
          {result.message}
        </div>
      )}

      {items.map((userItem) => {
        const isUsed = !!userItem.usedAt;
        const isExpired = userItem.expiresAt ? new Date(userItem.expiresAt) < new Date() : false;
        const isAvailable = !isUsed && !isExpired;

        return (
          <Card
            key={userItem.id}
            className={!isAvailable ? "opacity-60" : ""}
          >
            <CardContent className="flex items-center gap-4 p-4">
              {/* Icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-xl">
                {userItem.item.type === "BOOST" && "⚡"}
                {userItem.item.type === "BADGE" && "🏅"}
                {userItem.item.type === "FEATURE" && "🔓"}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{userItem.item.name}</span>
                  {isUsed && <Badge variant="secondary">已使用</Badge>}
                  {isExpired && !isUsed && <Badge variant="destructive">已過期</Badge>}
                  {isAvailable && <Badge variant="success">可使用</Badge>}
                </div>
                {userItem.item.effect && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{userItem.item.effect}</p>
                )}
                {userItem.expiresAt && !isUsed && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    到期：{new Date(userItem.expiresAt).toLocaleString("zh-TW")}
                  </p>
                )}
              </div>

              {/* Use Button */}
              {isAvailable && userItem.item.type === "BOOST" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUse(userItem.id)}
                  disabled={isPending && activeItemId === userItem.id}
                >
                  <Zap className="mr-1 h-3.5 w-3.5" />
                  {isPending && activeItemId === userItem.id ? "使用中..." : "使用"}
                </Button>
              )}
              {isAvailable && userItem.item.type !== "BOOST" && (
                <div className="flex items-center gap-1 text-xs text-success">
                  <Check className="h-4 w-4" />
                  已擁有
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
