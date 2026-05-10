"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { X, Megaphone, AlertTriangle, AlertOctagon } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Ann = {
  id: string;
  title: string;
  body: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  isPinned: boolean;
};

const STYLE: Record<Ann["severity"], { bg: string; icon: typeof Megaphone; text: string }> = {
  INFO: { bg: "bg-primary/10 border-primary/30 text-primary", icon: Megaphone, text: "text-primary" },
  WARNING: { bg: "bg-warning/10 border-warning/30 text-warning", icon: AlertTriangle, text: "text-warning" },
  CRITICAL: { bg: "bg-destructive/10 border-destructive/30 text-destructive", icon: AlertOctagon, text: "text-destructive" },
};

export function AnnouncementBanner() {
  const { data } = useSWR<{ announcements: Ann[] }>(
    "/api/announcements/active",
    fetcher,
    { refreshInterval: 5 * 60 * 1000 } // 每 5 分鐘 refresh
  );
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dismissed_announcements");
      if (raw) setDismissed(new Set(JSON.parse(raw)));
    } catch {/* noop */}
    setHydrated(true);
  }, []);

  if (!hydrated) return null;
  if (!data?.announcements?.length) return null;

  const visibleAll = data.announcements.filter((a) => a.isPinned || !dismissed.has(a.id));
  if (visibleAll.length === 0) return null;
  // 手機只顯示前 2 筆（首屏占用降到合理）；桌面顯示前 5
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const visible = isMobile ? visibleAll.slice(0, 2) : visibleAll.slice(0, 5);

  function dismiss(id: string) {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try {
      localStorage.setItem("dismissed_announcements", JSON.stringify(Array.from(next)));
    } catch {/* noop */}
  }

  return (
    <div className="space-y-1.5">
      {visible.map((a) => {
        const s = STYLE[a.severity];
        const Icon = s.icon;
        return (
          <div key={a.id} className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${s.bg}`}>
            <Icon className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold">
                {a.isPinned && <span className="mr-1 rounded bg-warning/20 px-1 text-[10px] text-warning">置頂</span>}
                {a.title}
              </p>
              <p className="mt-0.5 text-xs whitespace-pre-wrap opacity-80 line-clamp-3">{a.body}</p>
            </div>
            {!a.isPinned && (
              <button onClick={() => dismiss(a.id)} className="shrink-0 rounded p-1 hover:bg-black/5">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
