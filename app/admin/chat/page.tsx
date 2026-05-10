import Link from "next/link";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "即時聊天監控" };

export default async function AdminChatPage({
  searchParams,
}: { searchParams: { q?: string; roomId?: string; page?: string } }) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 100;
  const q = searchParams.q?.trim();
  const roomId = searchParams.roomId;

  const where: Record<string, unknown> = {};
  if (q) where.content = { contains: q, mode: "insensitive" };
  if (roomId) where.roomId = roomId;

  const [msgs, total] = await Promise.all([
    db.chatMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit, take: limit,
      include: { sender: { select: { id: true, displayName: true } } },
    }),
    db.chatMessage.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">💬 即時聊天監控</h1>
        <p className="text-sm text-muted-foreground mt-1">{total.toLocaleString()} 則聊天訊息</p>
      </div>
      <form className="flex gap-2 text-sm">
        <input name="q" defaultValue={q ?? ""} placeholder="搜尋內容關鍵字…"
          className="flex-1 rounded border bg-background px-3 py-2" />
        <input name="roomId" defaultValue={roomId ?? ""} placeholder="Room ID"
          className="w-40 rounded border bg-background px-3 py-2 font-mono text-xs" />
        <button type="submit" className="rounded bg-primary px-3 py-2 text-primary-foreground">搜尋</button>
      </form>

      <div className="md:overflow-x-auto md:rounded-lg md:border">
        <table className="responsive-table w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-2 text-left">時間</th>
              <th className="p-2 text-left">Room</th>
              <th className="p-2 text-left">發送者</th>
              <th className="p-2 text-left">內容</th>
              <th className="p-2 w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {msgs.map((m) => (
              <tr key={m.id} className="border-b hover:bg-muted/20">
                <td data-label="時間" className="p-2 whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(m.createdAt).toLocaleString("zh-TW")}
                </td>
                <td data-label="Room" className="p-2 text-xs font-mono text-muted-foreground">{m.roomId.slice(0, 12)}</td>
                <td data-label="發送者" className="p-2">
                  <Link href={`/admin/users/${m.sender.id}`} className="text-primary hover:underline">
                    {m.sender.displayName}
                  </Link>
                </td>
                <td data-label="內容" className="p-2 max-w-[400px] truncate text-muted-foreground" title={m.content}>{m.content}</td>
                <td data-label="操作" className="p-2">
                  <form action={`/api/admin/chat-messages/${m.id}/delete`} method="POST">
                    <button type="submit"
                      className="rounded border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                      onClick={(e) => { if (!confirm("刪除此聊天訊息？")) e.preventDefault(); }}>
                      刪除
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {msgs.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">無聊天紀錄</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 && <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}`} className="rounded border px-3 py-1">上一頁</Link>}
          <span className="px-3 py-1">{page} / {totalPages}</span>
          {page < totalPages && <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`} className="rounded border px-3 py-1">下一頁</Link>}
        </div>
      )}
    </div>
  );
}
