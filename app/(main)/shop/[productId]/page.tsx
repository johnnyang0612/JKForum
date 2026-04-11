"use client";

import { useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Coins, Gem, Clock, ShoppingCart, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { purchaseItemAction } from "@/lib/actions/shop-actions";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const typeLabels: Record<string, string> = {
  BOOST: "加成道具",
  BADGE: "勳章",
  FEATURE: "功能解鎖",
};

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.productId as string;

  const { data: productData, isLoading } = useSWR(`/api/shop/items/${productId}`, fetcher);
  const { data: userData } = useSWR("/api/user/points", fetcher);

  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null);

  const item = productData?.data?.item;
  const userCoins = userData?.data?.coins || 0;
  const userPlatinum = userData?.data?.platinum || 0;

  function handlePurchase() {
    if (!item) return;
    setResult(null);
    startTransition(async () => {
      const res = await purchaseItemAction(item.id);
      setResult(res);
    });
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-2 py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-muted-foreground">載入中...</span>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-2xl text-center py-12">
        <p className="text-lg text-muted-foreground">找不到該商品</p>
        <Link href="/shop" className="mt-4 inline-block text-primary hover:underline">
          返回商城
        </Link>
      </div>
    );
  }

  const currencyIcon = item.currency === "COINS"
    ? <Coins className="h-5 w-5 text-yellow-500" />
    : <Gem className="h-5 w-5 text-purple-500" />;
  const currencyName = item.currency === "COINS" ? "金幣" : "白金幣";
  const canAfford = item.currency === "COINS"
    ? userCoins >= item.price
    : userPlatinum >= item.price;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <Link
        href="/shop"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回商城
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            {/* Large icon */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-4xl">
              {item.type === "BOOST" && "⚡"}
              {item.type === "BADGE" && "🏅"}
              {item.type === "FEATURE" && "🔓"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{item.name}</CardTitle>
                <Badge>{typeLabels[item.type] || item.type}</Badge>
              </div>
              {item.description && (
                <p className="mt-2 text-muted-foreground">{item.description}</p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Details */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-sm text-muted-foreground">價格</p>
              <div className="mt-1 flex items-center justify-center gap-1">
                {currencyIcon}
                <span className="text-lg font-bold">{item.price}</span>
              </div>
              <p className="text-xs text-muted-foreground">{currencyName}</p>
            </div>

            {item.effect && (
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm text-muted-foreground">效果</p>
                <p className="mt-1 text-sm font-medium">{item.effect}</p>
              </div>
            )}

            <div className="rounded-lg border p-3 text-center">
              <p className="text-sm text-muted-foreground">有效期</p>
              <div className="mt-1 flex items-center justify-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {item.duration ? `${item.duration} 小時` : "永久"}
                </span>
              </div>
            </div>
          </div>

          {/* Purchase section */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">確認購買</p>
                <p className="text-sm text-muted-foreground">
                  購買後將從您的帳戶扣除 {item.price} {currencyName}
                </p>
              </div>
              <Button
                size="lg"
                onClick={handlePurchase}
                disabled={!canAfford || isPending}
              >
                {isPending ? (
                  "處理中..."
                ) : !canAfford ? (
                  "餘額不足"
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    確認購買
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Result */}
          {result?.error && (
            <div className="rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
              {result.error}
            </div>
          )}
          {result?.success && (
            <div className="rounded-lg border border-success/20 bg-success/5 p-4">
              <div className="flex items-center gap-2 text-success">
                <Check className="h-5 w-5" />
                <span className="font-medium">{result.message}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                道具已加入你的背包，可在「我的背包」中查看。
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
