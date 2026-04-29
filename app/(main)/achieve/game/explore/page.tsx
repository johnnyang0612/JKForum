import { ActionPanel } from "@/components/game/action-panel";

export const metadata = { title: "地形探索 | 遊戲中心" };

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <ActionPanel
        title="🧭 地形探索"
        endpoint="/api/game/explore"
        paramKey="location"
        sites={[
          {
            key: "FALLEN_SANCTUARY",
            label: "墮落聖地",
            cost: 10,
            costUnit: "energy",
            description: "魔王領域，掉落惡魔角、小丑面具、污穢血液。每次抽 3 個。",
          },
          {
            key: "BURNING_LAND",
            label: "焚燒之地",
            cost: 5,
            costUnit: "energy",
            description: "火焰大地，掉落蜥蜴皮、伊佛利特皮、各色鬼首。每次抽 2 個。",
          },
          {
            key: "GIANT_FOREST",
            label: "巨木森林",
            cost: 1,
            costUnit: "energy",
            description: "翠綠森林，掉落特蘭梅爾果、白漿果、各色山花。每次抽 1 個。",
          },
        ]}
      />
    </div>
  );
}
