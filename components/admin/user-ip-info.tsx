/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import useSWR from "swr";
import Link from "next/link";
import { AlertTriangle, MapPin, Shield } from "lucide-react";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export function UserIpInfo({ userId }: { userId: string }) {
  const { data, isLoading } = useSWR(`/api/admin/users/${userId}/ip-info`, fetcher);
  if (isLoading) return <p className="text-sm text-muted-foreground">載入 IP 資訊...</p>;
  if (!data?.success) return <p className="text-sm text-rose-400">{data?.error ?? "載入失敗"}</p>;

  const u = data.user;
  const sharedCount = data.sharedIpCount;
  const danger = sharedCount >= 3;

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            註冊 IP
          </div>
          <div className="mt-1 font-mono text-sm">{u.registerIp ?? "—"}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {new Date(u.createdAt).toLocaleString("zh-TW")}
          </div>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            最後登入 IP
          </div>
          <div className="mt-1 font-mono text-sm">{u.lastLoginIp ?? "—"}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("zh-TW") : "—"}
          </div>
        </div>
      </div>

      {/* 共用 IP 警示 */}
      {sharedCount > 0 ? (
        <div
          className={`rounded-lg border p-3 ${
            danger ? "border-rose-500/40 bg-rose-500/10" : "border-amber-500/40 bg-amber-500/10"
          }`}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className={`h-4 w-4 ${danger ? "text-rose-400" : "text-amber-400"}`} />
            <div className="flex-1">
              <h4 className="text-sm font-bold">
                共用 IP 警示：{sharedCount} 個其他帳號使用相同 IP
                {danger && " — 高度疑似小號"}
              </h4>
              <ul className="mt-2 space-y-1 text-xs">
                {data.sharedIpUsers.slice(0, 10).map((s: any, i: number) => (
                  <li key={i} className="flex items-center justify-between gap-2">
                    <Link
                      href={`/profile/${s.id}`}
                      target="_blank"
                      className="hover:text-primary"
                    >
                      @{s.username}
                    </Link>
                    <span className="font-mono text-muted-foreground">
                      {s.sharedIp} ({s.via})
                    </span>
                  </li>
                ))}
                {data.sharedIpUsers.length > 10 && (
                  <li className="text-muted-foreground">+ {data.sharedIpUsers.length - 10} 更多</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
          <Shield className="mr-2 inline h-4 w-4 text-emerald-400" />
          IP 無共用 — 風險低
        </div>
      )}

      {/* 近期管理 IP（若是管理員）*/}
      {data.recentIps.length > 0 && (
        <div className="rounded-lg border bg-card p-3">
          <h4 className="mb-2 text-xs font-bold text-muted-foreground">
            近期管理操作 IP（{data.recentIps.length} 筆）
          </h4>
          <ul className="space-y-1 text-xs">
            {data.recentIps.map((r: any, i: number) => (
              <li key={i} className="flex items-center justify-between">
                <span className="font-mono">{r.ipAddress}</span>
                <span className="text-muted-foreground">
                  {r.action} · {new Date(r.createdAt).toLocaleString("zh-TW")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
