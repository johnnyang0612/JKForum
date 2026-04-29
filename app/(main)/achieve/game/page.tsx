import Link from "next/link";
import { Pickaxe, Compass, Gift, Store, FlaskConical, Award } from "lucide-react";

const PANELS = [
  {
    href: "/achieve/game/mine",
    icon: Pickaxe,
    title: "挖礦",
    desc: "巨龍巢穴 / 精靈峽谷 / 廢棄礦坑，消耗體力換礦石",
    color: "from-amber-500 to-orange-600",
  },
  {
    href: "/achieve/game/explore",
    icon: Compass,
    title: "地形探索",
    desc: "墮落聖地 / 焚燒之地 / 巨木森林，消耗體力換戰利品",
    color: "from-emerald-500 to-teal-600",
  },
  {
    href: "/achieve/game/treasure",
    icon: Gift,
    title: "開寶箱",
    desc: "黃金 / 白銀 / 青銅寶箱，消耗愛心隨機掉落",
    color: "from-rose-500 to-pink-600",
  },
  {
    href: "/achieve/game/store",
    icon: Store,
    title: "道具商店",
    desc: "用金幣購買符咒 / 靈氣 / 工具",
    color: "from-blue-500 to-indigo-600",
  },
  {
    href: "/achieve/game/craft",
    icon: FlaskConical,
    title: "道具合成",
    desc: "靈氣 → 魔法工藝、礦石升級、符咒進化",
    color: "from-purple-500 to-fuchsia-600",
  },
  {
    href: "/achieve/game/medal-craft",
    icon: Award,
    title: "勳章合成",
    desc: "小勳章 → 中勳章 → 大勳章",
    color: "from-yellow-500 to-amber-600",
  },
];

export const metadata = { title: "遊戲中心 | JKForum" };

export default function GameCenterPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">🎮 遊戲中心</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          挖礦、探索、開寶箱、合成 — 用體力 / 愛心 / 金幣換取稀有道具與勳章
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PANELS.map((p) => {
          const Icon = p.icon;
          return (
            <Link
              key={p.href}
              href={p.href}
              className="group relative overflow-hidden rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${p.color} opacity-20 blur-xl transition-opacity group-hover:opacity-30`}
              />
              <Icon className="h-9 w-9 text-primary" />
              <h2 className="mt-3 text-lg font-bold">{p.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {p.desc}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
