"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { data: session, update } = useSession();
  const success = params.get("success");
  const error = params.get("error");
  const [sending, setSending] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (success) {
      // 重新整理 session
      update();
    }
  }, [success, update]);

  async function send() {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/auth/send-verification-email", { method: "POST" });
      const j = await res.json();
      if (j.success) {
        toast.success(j.note);
        setEmailSent(j.sent);
        if (j.devLink) {
          setDevLink(j.devLink);
          // 自動複製到剪貼簿
          if (navigator.clipboard) {
            navigator.clipboard.writeText(j.devLink).catch(() => {});
          }
        }
      } else toast.error(j.error);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-10">
      {success ? (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-8 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" />
          <h1 className="mt-4 text-2xl font-bold">Email 驗證成功！</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            您現在可以發文、回覆、打賞了。
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link href="/">
              <Button>返回首頁</Button>
            </Link>
            <Link href="/posts/new">
              <Button variant="outline">立即發文</Button>
            </Link>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/5 p-8 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-rose-400" />
          <h1 className="mt-4 text-2xl font-bold">驗證失敗</h1>
          <p className="mt-2 text-sm text-muted-foreground">{decodeURIComponent(error)}</p>
          {session?.user && (
            <Button className="mt-6" onClick={send} disabled={sending}>
              {sending ? "發送中..." : "重新發送驗證信"}
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <Mail className="mx-auto h-16 w-16 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">驗證您的 Email</h1>
          {session?.user ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                我們會寄一封驗證信到 <b>{session.user.email}</b>
                <br />
                點擊信中的連結即可完成驗證。
              </p>
              <div className="mt-6 rounded-lg border bg-muted/30 p-4 text-sm">
                <h2 className="font-bold">為什麼要驗證？</h2>
                <ul className="mt-2 space-y-1 text-left text-xs text-muted-foreground">
                  <li>✅ 解鎖發文、回覆、打賞功能</li>
                  <li>✅ 頭像獲得「已認證」徽章</li>
                  <li>✅ 防止帳號被盜，密碼重設更安全</li>
                </ul>
              </div>
              <Button className="mt-6 w-full" onClick={send} disabled={sending}>
                {sending ? "發送中..." : emailSent ? "✅ 已寄出（重新寄送）" : "📧 寄送驗證信"}
              </Button>

              {/* Dev mode: 直接顯示驗證連結 */}
              {devLink && (
                <div className="mt-4 rounded-lg border-2 border-amber-500/40 bg-amber-500/10 p-4 text-left">
                  <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400">
                    🛠️ Demo 模式 — 未配置真實寄信
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    驗證連結已產生（也已複製到剪貼簿）。Demo 用：點下方按鈕直接驗證。
                  </p>
                  <a
                    href={devLink}
                    className="mt-3 inline-block w-full rounded-lg bg-amber-500 px-4 py-2 text-center text-sm font-bold text-white hover:bg-amber-600"
                  >
                    🔓 一鍵驗證（模擬點信中連結）
                  </a>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                      查看完整驗證連結
                    </summary>
                    <code className="mt-1 block break-all rounded bg-background p-2 text-[10px]">
                      {devLink}
                    </code>
                  </details>
                </div>
              )}

              {emailSent && !devLink && (
                <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-muted-foreground">
                  📬 驗證信已寄到 <b>{session.user.email}</b>
                  <br />
                  請查看信箱（垃圾郵件夾也檢查一下），點擊信中連結即可完成驗證。
                </div>
              )}
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">請先登入後驗證您的 Email</p>
              <Link href="/login">
                <Button className="mt-6">前往登入</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
