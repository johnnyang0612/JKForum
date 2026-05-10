"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Phone, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function VerifyPhonePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  // 只允許站內相對路徑，避免 open redirect
  const nextSafe = nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : null;
  const [country, setCountry] = useState("+886");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"input" | "verify" | "done">("input");
  const [busy, setBusy] = useState(false);

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-10 text-center">
        <p>請先登入</p>
        <Link href="/login"><Button>前往登入</Button></Link>
      </div>
    );
  }

  async function send() {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, country }),
      });
      const j = await res.json();
      if (j.success) {
        toast.success(j.note ?? "驗證碼已發送");
        setStep("verify");
        // Demo 模式：自動填入驗證碼
        if (j.mockCode) {
          setTimeout(() => setCode(j.mockCode), 600);
        }
      } else toast.error(j.error);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const j = await res.json();
      if (j.success) {
        toast.success("手機驗證成功！");
        setStep("done");
        update();
        if (nextSafe) {
          setTimeout(() => router.push(nextSafe), 1200);
        }
      } else toast.error(j.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-10">
      {step === "done" ? (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-8 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" />
          <h1 className="mt-4 text-2xl font-bold">手機驗證成功！</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {nextSafe
              ? "1 秒後自動帶您回到原本要去的頁面。"
              : <>完成 Email + SMS 雙重驗證後，您的頭像會顯示 <ShieldCheck className="inline h-4 w-4 text-blue-400" /> 已認證徽章。</>
            }
          </p>
          <div className="mt-6 flex justify-center gap-2">
            {nextSafe ? (
              <Link href={nextSafe}><Button>立即繼續</Button></Link>
            ) : (
              <>
                <Link href="/"><Button>返回首頁</Button></Link>
                <Link href={`/profile/${session.user.id}`}>
                  <Button variant="outline">查看我的徽章</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-8">
          <Phone className="mx-auto h-16 w-16 text-primary" />
          <h1 className="mt-4 text-center text-2xl font-bold">手機 SMS 驗證</h1>

          <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
            🛠️ <b>Demo 模式</b>：不會真的發簡訊，驗證碼統一為 <b className="text-base">123456</b>（按發送後會自動填入）
          </div>

          {step === "input" ? (
            <>
              <div className="mt-6">
                <label className="mb-1 block text-sm font-medium">手機號碼</label>
                <div className="flex gap-2">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="rounded-lg border bg-background px-2 py-2 text-sm"
                  >
                    <option value="+886">🇹🇼 +886</option>
                    <option value="+852">🇭🇰 +852</option>
                    <option value="+86">🇨🇳 +86</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+81">🇯🇵 +81</option>
                  </select>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="例：912345678"
                    className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <Button
                className="mt-4 w-full"
                onClick={send}
                disabled={busy || !phone || phone.length < 8}
              >
                {busy ? "發送中..." : "發送驗證碼"}
              </Button>
            </>
          ) : (
            <>
              <p className="mt-6 text-sm text-muted-foreground text-center">
                驗證碼已發送至 {country} {phone}
              </p>
              <div className="mt-4">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  placeholder="輸入 6 位驗證碼"
                  maxLength={6}
                  className="w-full rounded-lg border bg-background px-3 py-3 text-center text-2xl tracking-widest font-mono"
                />
              </div>
              <Button
                className="mt-4 w-full"
                onClick={verify}
                disabled={busy || code.length !== 6}
              >
                {busy ? "驗證中..." : "確認驗證"}
              </Button>
              <button
                type="button"
                onClick={() => { setStep("input"); setCode(""); }}
                className="mt-2 w-full text-xs text-muted-foreground hover:text-primary"
              >
                重新輸入手機號
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
