/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatNumber } from "@/lib/utils/format";
import { Eye, MousePointerClick, Heart, MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BusinessAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const ads = await db.businessAd.findMany({
    where: { merchantId: session.user.id },
    orderBy: { viewCount: "desc" },
  });

  const total = ads.reduce(
    (s, a) => ({
      views: s.views + a.viewCount,
      clicks: s.clicks + a.clickCount,
      favs: s.favs + a.favoriteCount,
      contacts: s.contacts + a.contactCount,
    }),
    { views: 0, clicks: 0, favs: 0, contacts: 0 },
  );

  const ctr = total.views > 0 ? Math.round((total.clicks / total.views) * 1000) / 10 : 0;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">📊 成效分析</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          全部廣告累積數據（即時）
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Eye />} label="瀏覽數" value={formatNumber(total.views)} />
        <Stat icon={<MousePointerClick />} label="點擊數" value={formatNumber(total.clicks)} sub={`CTR ${ctr}%`} />
        <Stat icon={<Heart />} label="收藏數" value={formatNumber(total.favs)} />
        <Stat icon={<MessageCircle />} label="聯絡次數" value={formatNumber(total.contacts)} />
      </div>

      <section>
        <h2 className="mb-3 font-bold">🔥 廣告排行（按瀏覽數）</h2>
        {ads.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            尚無廣告
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-muted/50 text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">廣告標題</th>
                  <th className="px-3 py-2 text-center">層級</th>
                  <th className="px-3 py-2 text-right">瀏覽</th>
                  <th className="px-3 py-2 text-right">點擊</th>
                  <th className="px-3 py-2 text-right">收藏</th>
                  <th className="px-3 py-2 text-right">聯絡</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((a, i) => (
                  <tr key={a.id} className="border-t">
                    <td className="px-3 py-2 text-xs">{i + 1}</td>
                    <td className="px-3 py-2 text-xs">{a.title}</td>
                    <td className="px-3 py-2 text-center text-xs">{a.tier}</td>
                    <td className="px-3 py-2 text-right text-xs font-mono">{a.viewCount}</td>
                    <td className="px-3 py-2 text-right text-xs font-mono">{a.clickCount}</td>
                    <td className="px-3 py-2 text-right text-xs font-mono">{a.favoriteCount}</td>
                    <td className="px-3 py-2 text-right text-xs font-mono">{a.contactCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
