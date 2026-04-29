import Link from "next/link";
import { db } from "@/lib/db";
import { MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "即時聊天室 | JKForum" };

export default async function ChatLobbyPage() {
  const rooms = await db.chatRoom.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  // 每室最近訊息數（過去 24h）
  const counts = await Promise.all(
    rooms.map(async (r) => {
      const c = await db.chatMessage.count({
        where: {
          roomId: r.id,
          isDeleted: false,
          createdAt: { gt: new Date(Date.now() - 86400000) },
        },
      });
      return [r.id, c] as const;
    })
  );
  const countMap = new Map(counts);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <MessageCircle className="h-7 w-7 text-primary" />
          即時聊天室
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          公開留言版，輕鬆即時對話
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {rooms.map((r) => (
          <Link
            key={r.id}
            href={`/chat/${r.slug}`}
            className="group rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">
                # {r.name}
                {r.rating === "R18" && (
                  <span className="ml-2 rounded bg-rose-500/10 px-1.5 py-0.5 text-xs text-rose-400">
                    18+
                  </span>
                )}
              </h2>
              <span className="text-xs text-muted-foreground">
                24h {countMap.get(r.id) ?? 0} 則
              </span>
            </div>
            {r.description && (
              <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
