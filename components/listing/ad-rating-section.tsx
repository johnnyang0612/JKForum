"use client";

import { useState, useEffect, useTransition } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Star } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Rating = {
  id: string;
  score: number;
  comment: string | null;
  merchantReply: string | null;
  merchantRepliedAt: string | null;
  createdAt: string;
  user: { id: string; displayName: string; avatarUrl: string | null } | null;
};

export function AdRatingSection({
  adId,
  isAuthenticated,
  currentUserId,
  merchantId,
  initialAvg,
  initialCount,
}: {
  adId: string;
  isAuthenticated: boolean;
  currentUserId?: string | null;
  merchantId: string;
  initialAvg: number;
  initialCount: number;
}) {
  const { data, mutate } = useSWR<{ ratings: Rating[] }>(`/api/business/ads/${adId}/rate`, fetcher);
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [avg, setAvg] = useState(initialAvg);
  const [count, setCount] = useState(initialCount);

  // 同步既有評分
  useEffect(() => {
    if (!data?.ratings || !currentUserId) return;
    const mine = data.ratings.find((r) => r.user?.id === currentUserId);
    if (mine) {
      setScore(mine.score);
      setComment(mine.comment ?? "");
    }
  }, [data, currentUserId]);

  const canRate = isAuthenticated && currentUserId !== merchantId;

  function submit() {
    if (score < 1) {
      setMsg({ ok: false, text: "請至少給 1 顆星" });
      return;
    }
    setMsg(null);
    start(async () => {
      const r = await fetch(`/api/business/ads/${adId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, comment }),
      });
      const j = await r.json();
      if (r.ok) {
        setMsg({ ok: true, text: "評分已送出" });
        setAvg(j.ratingAvg);
        setCount(j.ratingCount);
        mutate();
      } else {
        setMsg({ ok: false, text: j?.error ?? "送出失敗" });
      }
    });
  }

  return (
    <section className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold">⭐ 消費者評分</h3>
        <div className="text-sm">
          <span className="font-bold text-amber-500">{avg.toFixed(1)}</span>
          <span className="ml-1 text-xs text-muted-foreground">/ 5 ({count} 評)</span>
        </div>
      </div>

      {/* 我的評分輸入區 */}
      {canRate ? (
        <div className="space-y-2 border-t pt-3">
          {msg && (
            <div className={`rounded border px-3 py-2 text-xs ${
              msg.ok ? "border-success/50 bg-success/10 text-success" : "border-danger/50 bg-danger/10 text-danger"
            }`}>{msg.text}</div>
          )}
          <p className="text-xs text-muted-foreground">給此業者打分</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScore(s)}
                onMouseEnter={() => setHoverScore(s)}
                onMouseLeave={() => setHoverScore(0)}
                className="tap-target rounded p-1 hover:bg-muted"
                aria-label={`${s} 星`}
              >
                <Star className={`h-7 w-7 transition-colors ${
                  (hoverScore || score) >= s
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground"
                }`} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="留下評語（選填，最多 500 字）"
            rows={3}
            maxLength={500}
            className="w-full rounded-md border bg-background px-3 py-2 text-base sm:text-sm"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{comment.length}/500</span>
            <button
              type="button"
              onClick={submit}
              disabled={pending || score < 1}
              className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-80 disabled:opacity-50 min-h-[40px]"
            >
              {pending ? "送出中…" : data?.ratings?.some((r) => r.user?.id === currentUserId) ? "更新評分" : "送出評分"}
            </button>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">登入</Link> 後可評分
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">業者本人不可評自己的廣告</p>
      )}

      {/* 評論列表 */}
      <div className="space-y-2 border-t pt-3">
        {data?.ratings?.length ? (
          data.ratings.map((r) => (
            <div key={r.id} className="rounded-md border bg-muted/30 p-3 text-sm">
              <div className="flex items-center gap-2">
                {r.user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.user.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium">
                    {r.user?.displayName ?? "匿名"}
                  </span>
                  <span className="ml-2 inline-flex items-center text-amber-500">
                    {Array.from({ length: r.score }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </span>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString("zh-TW")}
                </span>
              </div>
              {r.comment && <p className="mt-1 text-xs whitespace-pre-wrap">{r.comment}</p>}
              {r.merchantReply && (
                <div className="mt-2 rounded border-l-2 border-primary bg-primary/5 p-2 text-xs">
                  <p className="font-bold text-primary">
                    🏪 業者回覆
                    {r.merchantRepliedAt && (
                      <span className="ml-1 font-normal text-muted-foreground">
                        · {new Date(r.merchantRepliedAt).toLocaleDateString("zh-TW")}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap">{r.merchantReply}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-xs text-muted-foreground">尚無評分</p>
        )}
      </div>
    </section>
  );
}
