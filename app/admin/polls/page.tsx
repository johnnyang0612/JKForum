import Link from "next/link";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "投票管理" };

export default async function AdminPollsPage() {
  const polls = await db.poll.findMany({
    orderBy: { id: "desc" },
    take: 100,
    include: {
      options: { include: { _count: { select: { votes: true } } } },
      post: { select: { id: true, title: true, authorId: true } },
      _count: { select: { votes: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">🗳️ 投票管理</h1>
        <p className="text-sm text-muted-foreground mt-1">最新 100 個投票，含結果統計</p>
      </div>
      <div className="space-y-3">
        {polls.map((p) => (
          <div key={p.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold">{p.question}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  共 {p._count.votes} 票 · {p.multiSelect ? "多選" : "單選"} ·
                  顯示結果：{p.showResultsAt} ·
                  {p.closesAt ? ` 截止 ${new Date(p.closesAt).toLocaleDateString("zh-TW")}` : " 不截止"}
                </p>
                <Link href={`/posts/${p.post.id}`} className="text-xs text-primary hover:underline">
                  → 在文章「{p.post.title}」中
                </Link>
              </div>
              <form action={`/api/admin/polls/${p.id}/close`} method="POST">
                <button type="submit"
                  className="rounded border border-warning/40 px-2 py-1 text-xs text-warning hover:bg-warning/10"
                  onClick={(e) => { if (!confirm("立即關閉此投票？")) e.preventDefault(); }}>
                  立即關閉
                </button>
              </form>
            </div>
            <div className="mt-3 space-y-1">
              {p.options.map((o) => {
                const pct = p._count.votes > 0 ? (o._count.votes / p._count.votes) * 100 : 0;
                return (
                  <div key={o.id} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span>{o.label}</span>
                      <span className="text-muted-foreground">{o._count.votes} 票 ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {polls.length === 0 && (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">尚無投票</p>
        )}
      </div>
    </div>
  );
}
