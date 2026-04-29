import { ActionPanel } from "@/components/game/action-panel";

export const metadata = { title: "挖礦 | 遊戲中心" };

export default function MinePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <ActionPanel
        title="⛏️ 挖礦"
        endpoint="/api/game/mine"
        paramKey="location"
        sites={[
          {
            key: "DRAGON_LAIR",
            label: "巨龍巢穴",
            cost: 10,
            costUnit: "energy",
            description: "頂級礦坑，掉落星之隕石、藍寶石礦等稀有物。每次抽 3 個。",
          },
          {
            key: "ELF_CANYON",
            label: "精靈峽谷",
            cost: 5,
            costUnit: "energy",
            description: "中階礦坑，較高機率掉落驚嘆礦石。每次抽 2 個。",
          },
          {
            key: "ABANDONED_MINE",
            label: "廢棄礦坑",
            cost: 1,
            costUnit: "energy",
            description: "新手礦坑，主要產出普通與精選礦石。每次抽 1 個。",
          },
        ]}
      />
    </div>
  );
}
