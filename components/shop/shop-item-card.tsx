"use client";

import { useState, useTransition } from "react";
import { ShoppingCart, Clock, Coins, Gem } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { purchaseItemAction } from "@/lib/actions/shop-actions";

interface ShopItemCardProps {
  item: {
    id: string;
    name: string;
    description: string | null;
    type: string;
    price: number;
    currency: string;
    iconUrl: string | null;
    effect: string | null;
    duration: number | null;
  };
  userCoins?: number;
  userPlatinum?: number;
}

const typeLabels: Record<string, { label: string; variant: "default" | "success" | "secondary" }> = {
  BOOST: { label: "加成道具", variant: "default" },
  BADGE: { label: "勳章", variant: "success" },
  FEATURE: { label: "功能解鎖", variant: "secondary" },
};

export function ShopItemCard({ item, userCoins = 0, userPlatinum = 0 }: ShopItemCardProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null);

  const currencyIcon = item.currency === "COINS"
    ? <Coins className="h-4 w-4 text-yellow-500" />
    : <Gem className="h-4 w-4 text-purple-500" />;
  const currencyName = item.currency === "COINS" ? "金幣" : "白金幣";
  const canAfford = item.currency === "COINS"
    ? userCoins >= item.price
    : userPlatinum >= item.price;

  const typeInfo = typeLabels[item.type] || typeLabels.BOOST;

  function handlePurchase() {
    setResult(null);
    startTransition(async () => {
      const res = await purchaseItemAction(item.id);
      setResult(res);
    });
  }

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Icon + Type Badge */}
          <div className="flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/5 text-2xl">
              {item.type === "BOOST" && "⚡"}
              {item.type === "BADGE" && "🏅"}
              {item.type === "FEATURE" && "🔓"}
            </div>
            <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
          </div>

          {/* Name + Description */}
          <div>
            <h3 className="font-semibold">{item.name}</h3>
            {item.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            )}
          </div>

          {/* Effect + Duration */}
          {item.effect && (
            <p className="text-xs text-primary">{item.effect}</p>
          )}
          {item.duration && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>有效期 {item.duration} 小時</span>
            </div>
          )}

          {/* Price + Buy Button */}
          <div className="mt-auto flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-1.5">
              {currencyIcon}
              <span className="font-bold">{item.price}</span>
              <span className="text-xs text-muted-foreground">{currencyName}</span>
            </div>
            <Button
              size="sm"
              onClick={handlePurchase}
              disabled={!canAfford || isPending}
            >
              {isPending ? (
                "購買中..."
              ) : !canAfford ? (
                "餘額不足"
              ) : (
                <>
                  <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                  購買
                </>
              )}
            </Button>
          </div>

          {/* Result message */}
          {result?.error && (
            <p className="text-xs text-danger">{result.error}</p>
          )}
          {result?.success && (
            <p className="text-xs text-success">{result.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
