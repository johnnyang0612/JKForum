/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { db } from "@/lib/db";
import { Mail } from "lucide-react";
import { AdminVerifyButtons } from "@/components/admin/admin-verify-buttons";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Email/SMS 驗證管理" };

export default async function AdminEmailTokensPage() {
  const [pendingTokens, unverifiedUsers, totalUsers, emailVerifiedCount, smsVerifiedCount] = await Promise.all([
    db.verificationToken.findMany({
      orderBy: { expires: "desc" },
      take: 30,
    }),
    db.user.findMany({
      where: {
        OR: [
          { emailVerified: null },
          { smsVerified: null },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        emailVerified: true,
        smsVerified: true,
        phoneNumber: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.user.count(),
    db.user.count({ where: { emailVerified: { not: null } } }),
    db.user.count({ where: { smsVerified: { not: null } } }),
  ]);

  const fullVerifiedCount = await db.user.count({
    where: { emailVerified: { not: null }, smsVerified: { not: null } },
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Mail className="h-7 w-7 text-primary" />
          Email / SMS 驗證管理
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          客服救援、demo 驗證、查看 pending tokens
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">總會員</p>
          <p className="mt-1 text-2xl font-bold">{totalUsers}</p>
        </div>
        <div className="rounded-xl border bg-emerald-500/10 p-4">
          <p className="text-xs text-muted-foreground">Email ✓</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {emailVerifiedCount} <span className="text-xs">({Math.round(emailVerifiedCount / totalUsers * 100)}%)</span>
          </p>
        </div>
        <div className="rounded-xl border bg-blue-500/10 p-4">
          <p className="text-xs text-muted-foreground">SMS ✓</p>
          <p className="mt-1 text-2xl font-bold text-blue-400">
            {smsVerifiedCount} <span className="text-xs">({Math.round(smsVerifiedCount / totalUsers * 100)}%)</span>
          </p>
        </div>
        <div className="rounded-xl border bg-fuchsia-500/10 p-4">
          <p className="text-xs text-muted-foreground">雙重認證 ✓✓</p>
          <p className="mt-1 text-2xl font-bold text-fuchsia-400">
            {fullVerifiedCount}
          </p>
        </div>
      </div>

      {/* Pending tokens */}
      <section>
        <h2 className="mb-3 font-bold">📧 待用 Email 驗證 token ({pendingTokens.length})</h2>
        {pendingTokens.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            目前沒有 pending tokens
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-muted/50 text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Token</th>
                  <th className="px-3 py-2 text-right">到期時間</th>
                  <th className="px-3 py-2 text-center">驗證連結</th>
                </tr>
              </thead>
              <tbody>
                {pendingTokens.map((t) => (
                  <tr key={t.token} className="border-t">
                    <td className="px-3 py-2 text-xs">{t.identifier}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{t.token.slice(0, 16)}…</td>
                    <td className="px-3 py-2 text-right text-xs">
                      {new Date(t.expires).toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <a
                        href={`/api/auth/verify-email?token=${t.token}&email=${encodeURIComponent(t.identifier)}`}
                        className="text-xs text-primary hover:underline"
                      >
                        🔓 一鍵驗證
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 未驗證用戶 */}
      <section>
        <h2 className="mb-3 font-bold">👤 未完成驗證用戶 ({unverifiedUsers.length})</h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="px-3 py-2 text-left">用戶</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-center">Email</th>
                <th className="px-3 py-2 text-center">SMS</th>
                <th className="px-3 py-2 text-center">客服強制驗證</th>
              </tr>
            </thead>
            <tbody>
              {unverifiedUsers.map((u) => (
                <tr key={u.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 text-xs">
                    <Link href={`/admin/users/${u.id}`} className="hover:text-primary">
                      {u.displayName} <span className="opacity-60">@{u.username}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs">{u.email}</td>
                  <td className="px-3 py-2 text-center">
                    {u.emailVerified ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {u.smsVerified ? (
                      <span className="text-blue-400">✓</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <AdminVerifyButtons
                      userId={u.id}
                      emailVerified={!!u.emailVerified}
                      smsVerified={!!u.smsVerified}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
