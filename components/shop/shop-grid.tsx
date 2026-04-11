"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShopItemCard } from "./shop-item-card";

interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  type: string;
  price: number;
  currency: string;
  iconUrl: string | null;
  effect: string | null;
  duration: number | null;
}

interface ShopGridProps {
  items: ShopItem[];
  userCoins?: number;
  userPlatinum?: number;
}

export function ShopGrid({ items, userCoins = 0, userPlatinum = 0 }: ShopGridProps) {
  const boostItems = items.filter((item) => item.type === "BOOST");
  const badgeItems = items.filter((item) => item.type === "BADGE");
  const featureItems = items.filter((item) => item.type === "FEATURE");

  return (
    <Tabs defaultValue="all">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="all">全部道具</TabsTrigger>
        <TabsTrigger value="BOOST">加成道具</TabsTrigger>
        <TabsTrigger value="BADGE">勳章</TabsTrigger>
        <TabsTrigger value="FEATURE">功���解鎖</TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <ItemGrid items={items} userCoins={userCoins} userPlatinum={userPlatinum} />
      </TabsContent>

      <TabsContent value="BOOST">
        {boostItems.length > 0 ? (
          <ItemGrid items={boostItems} userCoins={userCoins} userPlatinum={userPlatinum} />
        ) : (
          <EmptyState message="暫無加成道具" />
        )}
      </TabsContent>

      <TabsContent value="BADGE">
        {badgeItems.length > 0 ? (
          <ItemGrid items={badgeItems} userCoins={userCoins} userPlatinum={userPlatinum} />
        ) : (
          <EmptyState message="暫���勳章" />
        )}
      </TabsContent>

      <TabsContent value="FEATURE">
        {featureItems.length > 0 ? (
          <ItemGrid items={featureItems} userCoins={userCoins} userPlatinum={userPlatinum} />
        ) : (
          <EmptyState message="暫無功能解鎖" />
        )}
      </TabsContent>
    </Tabs>
  );
}

function ItemGrid({
  items,
  userCoins,
  userPlatinum,
}: {
  items: ShopItem[];
  userCoins: number;
  userPlatinum: number;
}) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ShopItemCard
          key={item.id}
          item={item}
          userCoins={userCoins}
          userPlatinum={userPlatinum}
        />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border bg-card py-12">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
