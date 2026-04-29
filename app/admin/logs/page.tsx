/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { db } from "@/lib/db";
import { Pagination } from "@/components/shared/pagination";
import { timeAgo } from "@/lib/utils/format";
import {
  Ban, UserCheck, VolumeX, Volume2, Trash2, EyeOff, Pin, PinOff,
  Star, Lock, MoveRight, Edit, FilePlus, FileX, Flag, Coins, Award,
  Settings, Activity,
} from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "操作日誌" };

interface Props {
  searchParams: { page?: string; action?: string; q?: string };
}

const ACTION_META: Record<string, { label: string; color: string; icon: any }> = {
  USER_BAN:        { label: "封鎖用戶", color: "text-rose-400 bg-rose-500/10", icon: Ban },
  USER_UNBAN:      { label: "解除封鎖", color: "text-emerald-400 bg-emerald-500/10", icon: UserCheck },
  USER_MUTE:       { label: "禁言",     color: "text-amber-400 bg-amber-500/10", icon: VolumeX },
  USER_UNMUTE:     { label: "解除禁言", color: "text-emerald-400 bg-emerald-500/10", icon: Volume2 },
  POST_DELETE:     { label: "刪除文章", color: "text-rose-400 bg-rose-500/10", icon: Trash2 },
  POST_HIDE:       { label: "隱藏文章", color: "text-zinc-400 bg-zinc-500/10", icon: EyeOff },
  POST_PIN:        { label: "置頂",     color: "text-amber-400 bg-amber-500/10", icon: Pin },
  POST_UNPIN:      { label: "取消置頂", color: "text-zinc-400 bg-zinc-500/10", icon: PinOff },
  POST_FEATURE:    { label: "加精華",   color: "text-yellow-400 bg-yellow-500/10", icon: Star },
  POST_LOCK:       { label: "鎖文",     color: "text-red-400 bg-red-500/10", icon: Lock },
  POST_MOVE:       { label: "移動文章", color: "text-sky-400 bg-sky-500/10", icon: MoveRight },
  REPLY_DELETE:    { label: "刪除回覆", color: "text-rose-400 bg-rose-500/10", icon: Trash2 },
  FORUM_CREATE:    { label: "建版",     color: "text-emerald-400 bg-emerald-500/10", icon: FilePlus },
  FORUM_EDIT:      { label: "改版",     color: "text-blue-400 bg-blue-500/10", icon: Edit },
  FORUM_DELETE:    { label: "刪版",     color: "text-rose-400 bg-rose-500/10", icon: FileX },
  REPORT_RESOLVE:  { label: "處理檢舉", color: "text-emerald-400 bg-emerald-500/10", icon: Flag },
  REPORT_DISMISS:  { label: "駁回檢舉", color: "text-zinc-400 bg-zinc-500/10", icon: Flag },
  POINTS_ADJUST:   { label: "調整積分", color: "text-yellow-400 bg-yellow-500/10", icon: Coins },
  LEVEL_ADJUST:    { label: "調整等級", color: "text-fuchsia-400 bg-fuchsia-500/10", icon: Award },
  SETTINGS_CHANGE: { label: "改設定",   color: "text-sky-400 bg-sky-500/10", icon: Settings },
};

function targetLink(type: string, id: string) {
  const t = type.toLowerCase();
  if (t === "user") return `/profile/${id}`;
  if (t === "post") return `/posts/${id}`;
  if (t === "reply") return `/posts/${id}`;
  if (t === "forum") return `/admin/forums`;
  return null;
}

export default async function AdminLogsPage({ searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 30;
  const actionFilter = searchParams.action;
  const q = searchParams.q?.trim();

  const where: Record<string, unknown> = {};
  if (actionFilter) where.action = actionFilter;
  if (q) where.detail = { contains: q, mode: "insensitive" };

  const [logs, total] = await Promise.all([
    db.adminLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        admin: {
          select: {
            id: true,
            displayName: true,
            username: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    }),
    db.adminLog.count({ where }),
  ]);
  const totalPages = Math.ceil(total / limit);

  // 各 action 統計（過去 30 天）
  const since = new Date(Date.now() - 30 * 86400000);
  const stats = await db.adminLog.groupBy({
    by: ["action"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { action: "desc" } },
  });

  // 最活躍的管理員（過去 30 天）
  const topAdmins = await db.adminLog.groupBy({
    by: ["adminId"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { adminId: "desc" } },
    take: 5,
  });
  const topAdminUsers = topAdmins.length
    ? await db.user.findMany({
        where: { id: { in: topAdmins.map((a) => a.adminId) } },
        select: { id: true, displayName: true, username: true },
      })
    : [];
  const topMap = new Map(topAdminUsers.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Activity className="h-7 w-7 text-primary" />
            操作日誌
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {total} 筆紀錄；過去 30 天 {stats.reduce((s, x) => s + x._count._all, 0)} 筆操作
          </p>
        </div>
      </header>

      {/* 統計區 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-bold text-muted-foreground">📊 30 天內動作分布</h3>
          <div className="flex flex-wrap gap-2">
            {stats.slice(0, 12).map((s) => {
              const meta = ACTION_META[s.action];
              return (
                <Link
                  key={s.action}
                  href={`/admin/logs?action=${s.action}`}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition hover:scale-105 ${
                    meta?.color ?? "bg-muted text-muted-foreground"
                  }`}
                >
                  {meta?.label ?? s.action} <b>{s._count._all}</b>
                </Link>
              );
            })}
            {stats.length === 0 && (
              <span className="text-xs text-muted-foreground">本月無操作紀錄</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-bold text-muted-foreground">👑 最活躍管理員（30 天）</h3>
          {topAdmins.length === 0 ? (
            <p className="text-xs text-muted-foreground">本月無活躍管理員</p>
          ) : (
            <ol className="space-y-1.5 text-sm">
              {topAdmins.map((a, i) => {
                const u = topMap.get(a.adminId);
                if (!u) return null;
                const medal = ["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`;
                return (
                  <li key={a.adminId} className="flex items-center justify-between">
                    <Link href={`/profile/${u.id}`} className="hover:text-primary">
                      {medal} {u.displayName}
                      <span className="ml-1 text-xs text-muted-foreground">@{u.username}</span>
                    </Link>
                    <span className="text-xs font-bold">{a._count._all} 次</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      {/* 篩選 */}
      <form action="/admin/logs" className="flex flex-wrap gap-2">
        <select
          name="action"
          defaultValue={actionFilter ?? ""}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">全部動作</option>
          {Object.entries(ACTION_META).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="搜尋詳情內容..."
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          篩選
        </button>
        {(actionFilter || q) && (
          <Link
            href="/admin/logs"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
          >
            清除
          </Link>
        )}
      </form>

      {/* 日誌列表 — 卡片風 */}
      <div className="space-y-2">
        {logs.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            暫無操作紀錄
          </div>
        ) : (
          logs.map((log) => {
            const meta = ACTION_META[log.action];
            const Icon = meta?.icon ?? Activity;
            const link = targetLink(log.targetType, log.targetId);
            return (
              <div
                key={log.id}
                className="group flex items-start gap-3 rounded-xl border bg-card p-3 text-sm transition hover:border-primary/30"
              >
                <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${meta?.color ?? "bg-muted"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <Link
                      href={`/profile/${log.admin.id}`}
                      className="font-bold hover:text-primary"
                    >
                      {log.admin.displayName}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      @{log.admin.username}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta?.color ?? "bg-muted text-muted-foreground"}`}>
                      {meta?.label ?? log.action}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground" title={new Date(log.createdAt).toLocaleString("zh-TW")}>
                      {timeAgo(log.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>目標：</span>
                    {link ? (
                      <Link href={link} className="rounded bg-muted px-1.5 py-0.5 font-mono hover:text-primary">
                        {log.targetType.toLowerCase()} / {log.targetId.slice(0, 10)}…
                      </Link>
                    ) : (
                      <code className="rounded bg-muted px-1.5 py-0.5">
                        {log.targetType.toLowerCase()} / {log.targetId.slice(0, 10)}…
                      </code>
                    )}
                    {log.ipAddress && (
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                        IP: {log.ipAddress}
                      </span>
                    )}
                  </div>
                  {log.detail && (
                    <p className="mt-1 text-xs leading-relaxed text-foreground/80">
                      {log.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
