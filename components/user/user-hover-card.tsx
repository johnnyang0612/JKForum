"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Calendar } from "lucide-react";

type UserCardData = {
  id: string;
  username: string;
  displayName: string;
  merchantName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  group: string;
  type: string;
  merchantVerified: boolean;
  joinedAt: string;
  stats: { posts: number; replies: number; likes: number; followers: number };
};

const cache = new Map<string, UserCardData>();
const inflight = new Map<string, Promise<UserCardData | null>>();

async function fetchUser(userId: string): Promise<UserCardData | null> {
  if (cache.has(userId)) return cache.get(userId)!;
  if (inflight.has(userId)) return inflight.get(userId)!;
  const p = fetch(`/api/users/${userId}/card`, { cache: "no-store" })
    .then((r) => r.json())
    .then((j) => {
      if (j.success && j.user) {
        cache.set(userId, j.user);
        return j.user as UserCardData;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => inflight.delete(userId));
  inflight.set(userId, p);
  return p;
}

interface Props {
  /** lazy fetch 模式 */
  userId?: string;
  /** legacy props-based（向後相容） */
  user?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    level?: number;
    bio?: string | null;
    postCount?: number;
    followerCount?: number;
  };
  children: React.ReactNode;
}

export function UserHoverCard({ userId, user, children }: Props) {
  const targetId = userId ?? user?.id;
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<UserCardData | null>(null);
  const enterTimer = useRef<NodeJS.Timeout | null>(null);
  const leaveTimer = useRef<NodeJS.Timeout | null>(null);

  function onEnter() {
    if (!targetId) return;
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    enterTimer.current = setTimeout(async () => {
      const u = cache.get(targetId) ?? (await fetchUser(targetId));
      if (u) {
        setData(u);
        setOpen(true);
      }
    }, 350);
  }
  function onLeave() {
    if (enterTimer.current) clearTimeout(enterTimer.current);
    leaveTimer.current = setTimeout(() => setOpen(false), 200);
  }

  useEffect(() => () => {
    if (enterTimer.current) clearTimeout(enterTimer.current);
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  }, []);

  return (
    <span className="relative inline-block" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {children}
      {open && data && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border-2 bg-card p-4 shadow-2xl"
          onMouseEnter={() => {
            if (leaveTimer.current) clearTimeout(leaveTimer.current);
          }}
          onMouseLeave={onLeave}
        >
          <div className="flex items-start gap-3">
            {data.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.avatarUrl} alt={data.displayName} className="h-14 w-14 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {data.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <Link
                  href={`/profile/${data.id}`}
                  className="truncate text-base font-bold hover:text-primary"
                >
                  {data.merchantName || data.displayName}
                </Link>
                {data.merchantVerified && (
                  <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                )}
              </div>
              <p className="truncate text-xs text-foreground/60">@{data.username}</p>
            </div>
          </div>

          {data.bio && (
            <p className="mt-3 line-clamp-2 text-sm text-foreground/80">{data.bio}</p>
          )}

          <div className="mt-3 grid grid-cols-4 gap-1 border-t pt-3 text-center">
            <Stat label="文章" value={data.stats.posts} color="text-sky-600" />
            <Stat label="回覆" value={data.stats.replies} color="text-emerald-600" />
            <Stat label="獲讚" value={data.stats.likes} color="text-rose-600" />
            <Stat label="粉絲" value={data.stats.followers} color="text-amber-600" />
          </div>

          <div className="mt-3 flex items-center gap-1 text-xs text-foreground/60">
            <Calendar className="h-3 w-3" />
            <span>加入於 {new Date(data.joinedAt).toLocaleDateString("zh-TW")}</span>
          </div>

          <Link
            href={`/profile/${data.id}`}
            className="mt-3 block w-full rounded-md bg-primary py-2 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            進入個人空間 →
          </Link>
        </div>
      )}
    </span>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className={`text-base font-extrabold ${color}`}>{value.toLocaleString()}</div>
      <div className="text-[10px] font-medium text-foreground/70">{label}</div>
    </div>
  );
}
