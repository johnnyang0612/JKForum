import Link from "next/link";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "私訊監控" };

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: { q?: string; senderId?: string; page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 50;
  const q = searchParams.q?.trim();
  const senderId = searchParams.senderId;

  const where: Record<string, unknown> = { isDeleted: false };
  if (q) where.content = { contains: q, mode: "insensitive" };
  if (senderId) where.senderId = senderId;

  const [messages, total] = await Promise.all([
    db.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        sender: { select: { id: true, displayName: true, username: true } },
        conversation: {
          select: {
            id: true,
            participants: {
              select: { user: { select: { id: true, displayName: true } } },
              take: 4,
            },
          },
        },
      },
    }),
    db.message.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">🛡️ 私訊監控</h1>
        <p className="text-sm text-muted-foreground mt-1">
          搜尋使用者私訊內容（用於違規調查）。共 {total.toLocaleString()} 筆。
        </p>
      </div>

      <form className="flex gap-2 text-sm">
        <input name="q" defaultValue={q ?? ""} placeholder="搜尋內容關鍵字…"
          className="flex-1 rounded border bg-background px-3 py-2" />
        <input name="senderId" defaultValue={senderId ?? ""} placeholder="發送者 user ID"
          className="w-48 rounded border bg-background px-3 py-2 font-mono text-xs" />
        <button type="submit" className="rounded bg-primary px-3 py-2 text-primary-foreground">搜尋</button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-2 text-left">時間</th>
              <th className="p-2 text-left">發送者</th>
              <th className="p-2 text-left">對話成員</th>
              <th className="p-2 text-left">類型</th>
              <th className="p-2 text-left">內容</th>
              <th className="p-2 w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id} className="border-b hover:bg-muted/20">
                <td className="p-2 whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(m.createdAt).toLocaleString("zh-TW")}
                </td>
                <td className="p-2">
                  <Link href={`/admin/users/${m.sender.id}`} className="text-primary hover:underline">
                    {m.sender.displayName}
                  </Link>
                </td>
                <td className="p-2 text-xs text-muted-foreground">
                  {m.conversation.participants.map((p) => p.user.displayName).join(" ↔ ")}
                </td>
                <td className="p-2 text-xs">
                  <span className={`rounded px-1.5 py-0.5 ${
                    m.messageType === "MERCHANT_INQUIRY" ? "bg-amber-500/10 text-amber-400" : "bg-muted"
                  }`}>{m.messageType === "MERCHANT_INQUIRY" ? "業者咨詢" : "私訊"}</span>
                </td>
                <td className="p-2 max-w-[400px] truncate text-muted-foreground" title={m.content}>
                  {m.content.slice(0, 200)}
                </td>
                <td className="p-2">
                  <form action={`/api/admin/messages/${m.id}/delete`} method="POST">
                    <button type="submit"
                      className="text-xs text-destructive hover:underline"
                      onClick={(e) => { if (!confirm("刪除此訊息？")) e.preventDefault(); }}>
                      刪除
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">無資料</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}`}
              className="rounded border px-3 py-1 hover:bg-muted">上一頁</Link>
          )}
          <span className="px-3 py-1">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`}
              className="rounded border px-3 py-1 hover:bg-muted">下一頁</Link>
          )}
        </div>
      )}
    </div>
  );
}
