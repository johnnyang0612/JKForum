"use client";

import { Store, Coins, Gem, Package } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShopGrid } from "@/components/shop/shop-grid";
import { InventoryList } from "@/components/shop/inventory-list";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ShopPage() {
  const { data: shopData, isLoading: shopLoading } = useSWR("/api/shop/items", fetcher);
  const { data: userData } = useSWR("/api/user/points", fetcher);
  const { data: inventoryData } = useSWR("/api/shop/inventory", fetcher);

  const items = shopData?.data?.items || [];
  const userCoins = userData?.data?.coins || 0;
  const userPlatinum = userData?.data?.platinum || 0;
  const inventory = inventoryData?.data?.items || [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Store className="h-7 w-7 text-primary" />
            積分商城
          </h1>
          <p className="mt-1 text-muted-foreground">
            使用金幣或白金幣兌換各種道具和勳章
          </p>
        </div>

        {/* Wallet */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">金幣</p>
              <p className="font-bold">{userCoins.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
            <Gem className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">白金幣</p>
              <p className="font-bold">{userPlatinum.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main tabs: Shop / Inventory */}
      <Tabs defaultValue="shop">
        <TabsList>
          <TabsTrigger value="shop">
            <Store className="mr-1.5 h-4 w-4" />
            商城
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="mr-1.5 h-4 w-4" />
            我的背包
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shop">
          {shopLoading ? (
            <div className="mt-8 flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">載入商城中...</p>
            </div>
          ) : items.length > 0 ? (
            <ShopGrid
              items={items}
              userCoins={userCoins}
              userPlatinum={userPlatinum}
            />
          ) : (
            <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border bg-card py-12">
              <Store className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">商城暫無商品</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventory">
          <div className="mt-4">
            <InventoryList items={inventory} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
