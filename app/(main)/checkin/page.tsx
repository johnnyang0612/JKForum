"use client";

import { useState, useTransition } from "react";
import { CalendarCheck, Coins, Flame, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { performCheckin } from "@/lib/actions/checkin-actions";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CheckinPage() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success?: boolean;
    error?: string;
    streak?: number;
    coinsEarned?: number;
    message?: string;
    alreadyCheckedIn?: boolean;
  } | null>(null);

  const { data: checkinData } = useSWR("/api/checkin", fetcher);
  const todayCheckin = checkinData?.data?.todayCheckin;
  const recentCheckins = checkinData?.data?.recentCheckins || [];
  const currentStreak = checkinData?.data?.currentStreak || 0;

  function handleCheckin() {
    startTransition(async () => {
      const res = await performCheckin();
      setResult(res);
    });
  }

  const alreadyDone = todayCheckin || result?.alreadyCheckedIn;
  const streak = result?.streak || currentStreak;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">每日簽到</h1>
        <p className="mt-1 text-muted-foreground">
          每天簽到可以獲得金幣，連續簽到還有額外獎勵！
        </p>
      </div>

      {/* Checkin button */}
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <CalendarCheck className={`h-12 w-12 ${alreadyDone ? "text-success" : "text-primary"}`} />
        </div>

        {result?.success && (
          <div className="text-center">
            <p className="text-lg font-bold text-success">{result.message}</p>
          </div>
        )}

        {result?.error && !result.alreadyCheckedIn && (
          <p className="text-sm text-danger">{result.error}</p>
        )}

        <Button
          size="lg"
          onClick={handleCheckin}
          loading={isPending}
          disabled={!!alreadyDone}
          className="text-lg px-12 py-6"
        >
          {alreadyDone ? "今日已簽到" : "立即簽到"}
        </Button>
      </div>

      {/* Streak info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4">
          <Flame className="h-8 w-8 text-orange-500" />
          <span className="text-2xl font-bold">{streak}</span>
          <span className="text-sm text-muted-foreground">連續簽到天數</span>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4">
          <Coins className="h-8 w-8 text-yellow-500" />
          <span className="text-2xl font-bold">30</span>
          <span className="text-sm text-muted-foreground">每日基礎獎勵</span>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4">
          <Gift className="h-8 w-8 text-purple-500" />
          <span className="text-sm text-muted-foreground text-center">
            連續 3 天 +50<br />
            連續 7 天 +100<br />
            連續 30 天 +300
          </span>
        </div>
      </div>

      {/* Recent checkins calendar-like display */}
      {recentCheckins.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-semibold">最近簽到記錄</h3>
          <div className="flex flex-wrap gap-2">
            {recentCheckins.map((checkin: { id: string; date: string; streak: number; coinsEarned: number }) => (
              <div
                key={checkin.id}
                className="flex flex-col items-center rounded-lg bg-success/10 p-2 text-xs"
              >
                <span className="font-medium text-success">
                  {new Date(checkin.date).getMonth() + 1}/{new Date(checkin.date).getDate()}
                </span>
                <span className="text-muted-foreground">
                  {checkin.coinsEarned} 幣
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
