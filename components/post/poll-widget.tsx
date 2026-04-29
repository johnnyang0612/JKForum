"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Vote } from "lucide-react";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

type PollData = {
  poll: {
    id: string;
    question: string;
    multiSelect: boolean;
    closesAt: string | null;
    options: { id: string; label: string; voteCount: number }[];
  } | null;
  myVotes: string[];
};

export function PollWidget({ postId, isAuthenticated }: { postId: string; isAuthenticated: boolean }) {
  const url = `/api/posts/${postId}/poll/vote`;
  const { data, isLoading } = useSWR<PollData>(url, fetcher);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  if (isLoading) return null;
  if (!data?.poll) return null;

  const poll = data.poll;
  const myVotes = data.myVotes || [];
  const hasVoted = myVotes.length > 0;
  const closed = poll.closesAt && new Date(poll.closesAt) < new Date();
  const totalVotes = poll.options.reduce((s, o) => s + o.voteCount, 0);

  const toggle = (id: string) => {
    if (poll.multiSelect) {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelected([id]);
    }
  };

  const submit = async () => {
    if (!isAuthenticated) {
      toast.error("請先登入");
      return;
    }
    if (selected.length === 0) {
      toast.error("請選擇至少一個選項");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIds: selected }),
      });
      const json = await res.json();
      if (!json.success) toast.error(json.error);
      else {
        toast.success("投票成功");
        setSelected([]);
        mutate(url);
      }
    } finally {
      setBusy(false);
    }
  };

  // 顯示模式：已投/已關閉 → 結果，否則投票面板
  const showResults = hasVoted || closed;

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="flex items-center gap-2 text-base font-bold">
        <Vote className="h-5 w-5 text-primary" />
        {poll.question}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {poll.multiSelect ? "多選" : "單選"} ·{" "}
        {totalVotes} 票
        {closed && <span className="ml-2 text-rose-400">已結束</span>}
        {hasVoted && !closed && <span className="ml-2 text-emerald-400">你已投票</span>}
      </p>

      <div className="mt-4 space-y-2">
        {poll.options.map((opt) => {
          const myVote = myVotes.includes(opt.id);
          const pct = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
          if (showResults) {
            return (
              <div key={opt.id} className="relative overflow-hidden rounded-lg border bg-muted/30 p-3">
                <div
                  className={`absolute inset-y-0 left-0 transition-all ${
                    myVote ? "bg-primary/30" : "bg-primary/10"
                  }`}
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    {myVote && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    {opt.label}
                  </span>
                  <span className="text-xs">
                    <b>{pct}%</b> · {opt.voteCount} 票
                  </span>
                </div>
              </div>
            );
          }
          const checked = selected.includes(opt.id);
          return (
            <label
              key={opt.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition ${
                checked ? "border-primary bg-primary/5" : "hover:bg-muted/40"
              }`}
            >
              <input
                type={poll.multiSelect ? "checkbox" : "radio"}
                name={`poll-${poll.id}`}
                checked={checked}
                onChange={() => toggle(opt.id)}
                className="h-4 w-4"
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>

      {!showResults && (
        <Button
          className="mt-4 w-full"
          onClick={submit}
          disabled={busy || selected.length === 0}
        >
          {busy ? "送出中..." : "送出投票"}
        </Button>
      )}
    </div>
  );
}
