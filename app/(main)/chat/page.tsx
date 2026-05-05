import Link from "next/link";
import { db } from "@/lib/db";
import { MessageCircle, ImageIcon } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "即時聊天室 | JKForum" };

function timeAgoShort(d: Date) {
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "剛剛";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} 分鐘前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} 小時前`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "昨天";
  if (diffDay < 7) return `${diffDay} 天前`;
  return d.toLocaleDateString("zh-TW", { month: "2-digit", day: "2-digit" });
}

export default async function ChatLobbyPage() {
  const rooms = await db.chatRoom.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const session = await getServerSession(authOptions);

  const enriched = await Promise.all(
    rooms.map(async (r) => {
      const lastMessage = await db.chatMessage.findFirst({
        where: { roomId: r.id, isDeleted: false },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          messageType: true,
          createdAt: true,
          sender: { select: { displayName: true, username: true } },
        },
      });

      const todayCount = await db.chatMessage.count({
        where: {
          roomId: r.id,
          isDeleted: false,
          createdAt: { gt: new Date(Date.now() - 86400000) },
        },
      });

      let unreadCount = 0;
      if (session?.user) {
        const read = await db.chatRoomRead.findUnique({
          where: {
            userId_roomId: { userId: session.user.id, roomId: r.id },
          },
          select: { lastReadAt: true },
        });
        const since = read?.lastReadAt ?? new Date(0);
        unreadCount = await db.chatMessage.count({
          where: {
            roomId: r.id,
            isDeleted: false,
            senderId: { not: session.user.id },
            createdAt: { gt: since },
          },
        });
      }

      return { room: r, lastMessage, todayCount, unreadCount };
    })
  );

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <MessageCircle className="h-7 w-7 text-primary" />
          即時聊天室
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          公開留言版，支援圖片、表情、引用回覆 · 5 分鐘內可撤回
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {enriched.map(({ room: r, lastMessage, todayCount, unreadCount }) => {
          const preview = lastMessage
            ? lastMessage.messageType === "IMAGE" && (!lastMessage.content || lastMessage.content.length === 0)
              ? "[圖片]"
              : lastMessage.content
            : "尚無訊息";
          return (
            <Link
              key={r.id}
              href={`/chat/${r.slug}`}
              className="group relative rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="truncate text-lg font-bold">
                  # {r.name}
                  {r.rating === "R18" && (
                    <span className="ml-2 rounded bg-rose-500/10 px-1.5 py-0.5 text-xs text-rose-400">
                      18+
                    </span>
                  )}
                </h2>
                <span className="flex-none text-xs text-muted-foreground">
                  24h {todayCount} 則
                </span>
              </div>
              {r.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                  {r.description}
                </p>
              )}

              {lastMessage ? (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="font-medium text-foreground/80">
                    {lastMessage.sender.displayName ??
                      lastMessage.sender.username}
                    ：
                  </span>
                  <span className="flex-1 truncate text-muted-foreground">
                    {lastMessage.messageType === "IMAGE" &&
                    (!lastMessage.content || lastMessage.content.length === 0) ? (
                      <span className="inline-flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" /> 圖片
                      </span>
                    ) : (
                      preview
                    )}
                  </span>
                  <span className="flex-none text-[10px] text-muted-foreground">
                    {timeAgoShort(new Date(lastMessage.createdAt))}
                  </span>
                </div>
              ) : (
                <p className="mt-2 text-xs italic text-muted-foreground">
                  尚無訊息
                </p>
              )}

              {unreadCount > 0 && (
                <span className="absolute right-3 top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
