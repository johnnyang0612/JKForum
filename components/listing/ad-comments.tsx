"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Trash } from "lucide-react";
import { toast } from "sonner";

type Comment = {
  id: string; content: string; createdAt: string;
  user: { id: string; displayName: string; avatarUrl: string | null; isMerchant: boolean };
  isOwner: boolean;
  isDeleted?: boolean;
};

export function AdComments({ adId, merchantId }: { adId: string; merchantId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [list, setList] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, [adId]);

  async function load() {
    const r = await fetch(`/api/business/ads/${adId}/comments`);
    const j = await r.json();
    if (j.success) setList(j.list);
  }
  async function submit() {
    if (!session?.user) {
      toast.error("請先登入");
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!text.trim() || text.length > 500) return toast.error("1~500 字");
    setBusy(true);
    try {
      const r = await fetch(`/api/business/ads/${adId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });
      const j = await r.json();
      if (j.success) { setText(""); await load(); toast.success("已留言"); }
      else toast.error(j.error);
    } finally { setBusy(false); }
  }
  async function del(id: string) {
    if (!confirm("確定刪除？")) return;
    const r = await fetch(`/api/business/ads/${adId}/comments/${id}`, { method: "DELETE" });
    const j = await r.json();
    if (j.success) await load();
    else toast.error(j.error);
  }

  return (
    <section className="rounded-xl border bg-card p-4">
      <h3 className="flex items-center gap-2 font-bold">
        <MessageSquare className="h-4 w-4" /> 留言 ({list.filter(c => !c.isDeleted).length})
      </h3>

      {session?.user ? (
        <div className="mt-3 flex gap-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)}
            rows={2} maxLength={500}
            placeholder={session.user.id === merchantId ? "以業者身份回覆..." : "對這家店有什麼想說的？"}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm" />
          <Button onClick={submit} disabled={busy} size="sm" className="self-end">
            <Send className="h-3 w-3" /> 送出
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-center text-xs text-muted-foreground">登入後可留言</p>
      )}

      <ul className="mt-4 space-y-3">
        {list.length === 0 ? (
          <li className="py-4 text-center text-xs text-muted-foreground">尚無留言</li>
        ) : list.map((c) => (
          <li key={c.id} className="flex gap-2 border-b pb-3 last:border-0">
            {c.user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : <div className="h-8 w-8 rounded-full bg-muted" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs">
                <span className="font-medium">{c.user.displayName}</span>
                {c.user.isMerchant && (
                  <span className="ml-1 rounded bg-primary/20 px-1.5 py-0.5 text-[9px] text-primary">業者</span>
                )}
                <span className="ml-2 text-muted-foreground">
                  {new Date(c.createdAt).toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </p>
              <p className={`mt-0.5 text-sm ${c.isDeleted ? "text-muted-foreground italic" : ""}`}>
                {c.isDeleted ? "（已刪除）" : c.content}
              </p>
            </div>
            {c.isOwner && !c.isDeleted && (
              <button onClick={() => del(c.id)} className="text-muted-foreground hover:text-rose-400">
                <Trash className="h-3 w-3" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
