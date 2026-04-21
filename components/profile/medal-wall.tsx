import { cn } from "@/lib/utils/cn";

export interface MedalItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconEmoji?: string | null;
  iconUrl?: string | null;
  tier: string;
  awardedAt?: Date | string;
  owned: boolean;
}

const TIER_COLORS: Record<string, string> = {
  bronze:  "from-amber-600/20 to-amber-900/30 ring-amber-600/40",
  silver:  "from-slate-300/20 to-slate-500/30 ring-slate-400/40",
  gold:    "from-yellow-400/20 to-yellow-600/30 ring-yellow-500/40",
  diamond: "from-cyan-300/20 to-blue-500/30 ring-cyan-400/40",
};

export function MedalWall({
  medals,
  title = "勳章牆",
}: {
  medals: MedalItem[];
  title?: string;
}) {
  const owned = medals.filter((m) => m.owned);
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">{owned.length}</span>
          <span className="text-muted-foreground"> / {medals.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
        {medals.map((m) => (
          <div
            key={m.id}
            className={cn(
              "group relative flex flex-col items-center gap-1 rounded-lg p-2 text-center transition-all",
              m.owned
                ? `bg-gradient-to-br ${TIER_COLORS[m.tier] || TIER_COLORS.bronze} ring-2`
                : "bg-muted/30 opacity-30 grayscale hover:opacity-60"
            )}
            title={`${m.name} — ${m.description}`}
          >
            <div className="text-3xl sm:text-4xl" aria-hidden>
              {m.iconEmoji || "🏅"}
            </div>
            <div className="text-[10px] font-semibold leading-tight line-clamp-2 sm:text-xs">
              {m.name}
            </div>
          </div>
        ))}
      </div>

      {medals.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          系統還沒設定勳章
        </p>
      )}
    </div>
  );
}
