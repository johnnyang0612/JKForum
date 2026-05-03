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
        if (j.devLink) {
          // 開發模式直接顯示
          console.log("Dev link:", j.devLink);
          toast.info("Dev mode: 連結已 log 到 console");
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
                {sending ? "發送中..." : "📧 寄送驗證信"}
              </Button>
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
