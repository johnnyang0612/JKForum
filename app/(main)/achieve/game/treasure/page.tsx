import { ActionPanel } from "@/components/game/action-panel";

export const metadata = { title: "開寶箱 | 遊戲中心" };

export default function TreasurePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <ActionPanel
        title="🎁 開寶箱"
        endpoint="/api/game/treasure"
        paramKey="treasure"
        sites={[
          {
            key: "GOLD",
            label: "黃金寶箱",
            cost: 10000,
            costUnit: "hearts",
            description: "最高階寶箱，必掉幸運符咒 + 高級靈氣 + 稀有礦石。每次抽 5 個。",
          },
          {
            key: "SILVER",
            label: "白銀寶箱",
            cost: 1000,
            costUnit: "hearts",
            description: "中階寶箱，掉落 A/B 級符咒、水火靈氣。每次抽 3 個。",
          },
          {
            key: "BRONZE",
            label: "青銅寶箱",
            cost: 100,
            costUnit: "hearts",
            description: "入門寶箱，掉落 B/C 級符咒、風地靈氣。每次抽 2 個。",
          },
        ]}
      />
    </div>
  );
}
