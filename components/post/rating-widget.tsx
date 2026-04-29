"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  postId: string;
  initialAvg: number;
  initialCount: number;
  isAuthenticated: boolean;
  isAuthor: boolean;
}

export function RatingWidget({
  postId,
  initialAvg,
  initialCount,
  isAuthenticated,
  isAuthor,
}: Props) {
  const router = useRouter();
  const [avg, setAvg] = useState(initialAvg);
  const [count, setCount] = useState(initialCount);
  const [hover, setHover] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [busy, setBusy] = useState(false);

  const display = hover || myScore || Math.round(avg);

  const click = async (n: number) => {
    if (!isAuthenticated) {
      toast.error("請先登入");
      return;
    }
    if (isAuthor) {
      toast.error("不能評自己的文章");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${postId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: n }),
      });
      const json = await res.json();
      if (!json.success) toast.error(json.error);
      else {
        toast.success(`感謝你的 ${n} 星評分`);
        setMyScore(n);
        setAvg(json.avg);
        setCount(json.count);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3 text-sm">
      <span className="text-muted-foreground">為這篇文章評分：</span>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= display;
          return (
            <button
              key={n}
              type="button"
              disabled={busy || isAuthor || !isAuthenticated}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => click(n)}
              className="rounded p-0.5 transition disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={`評 ${n} 星`}
            >
              <Star
                className={`h-5 w-5 transition ${
                  filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                }`}
              />
            </button>
          );
        })}
      </div>
      <span className="ml-1 text-xs text-muted-foreground">
        {avg > 0 ? <><b className="text-foreground">{avg.toFixed(1)}</b> / {count} 票</> : "尚無評分"}
      </span>
    </div>
  );
}
