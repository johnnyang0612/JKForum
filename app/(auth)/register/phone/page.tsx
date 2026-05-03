"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Smartphone, ArrowLeft } from "lucide-react";

export default function PhoneRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [country] = useState("+886");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [userType, setUserType] = useState<"MEMBER" | "BUSINESS">("MEMBER");
  const [merchantName, setMerchantName] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    if (!/^[0-9]{8,15}$/.test(phone)) return toast.error("手機號格式錯誤");
    setBusy(true);
    try {
      const r = await fetch("/api/auth/phone-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", phone, country }),
      });
      const j = await r.json();
      if (j.success) {
        toast.success(j.note ?? "驗證碼已送出");
        if (j.mockCode) setCode(j.mockCode);
        setStep(2);
      } else toast.error(j.error);
    } finally { setBusy(false); }
  }

  async function submit() {
    setBusy(true);
    try {
      const r = await fetch("/api/auth/phone-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify", phone, country, code, password, displayName,
          userType, merchantName,
        }),
      });
      const j = await r.json();
      if (!j.success) { toast.error(j.error); return; }
      // 自動登入
      const login = await signIn("credentials", {
        email: j.loginEmail, password, redirect: false,
      });
      if (login?.error) toast.error("自動登入失敗，請手動登入");
      router.push(userType === "BUSINESS" ? "/business" : "/");
      router.refresh();
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <div className="rounded-2xl border bg-card p-6">
        <Smartphone className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-3 text-center text-xl font-bold">手機號碼註冊</h1>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          純 OTP 驗證，無需 Email
        </p>

        {step === 1 ? (
          <div className="mt-5 space-y-3">
            <div>
              <label className="mb-1 block text-xs">手機號碼（不需區碼）</label>
              <div className="flex gap-1">
                <input value={country} disabled
                  className="w-20 rounded-md border bg-muted px-2 py-2 text-sm text-center" />
                <input value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="0912345678"
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm font-mono" />
              </div>
            </div>
            <Button onClick={sendCode} disabled={busy} className="w-full">
              {busy ? "送出中..." : "發送 OTP 驗證碼"}
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <div>
              <label className="mb-1 block text-xs">驗證碼（demo 自動填入）</label>
              <input value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                maxLength={6}
                className="w-full rounded-md border bg-background px-3 py-2 text-center text-lg font-mono tracking-widest" />
            </div>
            <div>
              <label className="mb-1 block text-xs">密碼（≥ 6 字）</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs">暱稱</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-2 block text-xs">註冊身分</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setUserType("MEMBER")}
                  className={`rounded-lg border p-2 text-sm ${userType === "MEMBER" ? "border-primary bg-primary/10 text-primary" : ""}`}>
                  👤 一般會員
                </button>
                <button type="button" onClick={() => setUserType("BUSINESS")}
                  className={`rounded-lg border p-2 text-sm ${userType === "BUSINESS" ? "border-primary bg-primary/10 text-primary" : ""}`}>
                  🏢 業者
                </button>
              </div>
            </div>
            {userType === "BUSINESS" && (
              <div>
                <label className="mb-1 block text-xs">商號 / 店名</label>
                <input value={merchantName} onChange={(e) => setMerchantName(e.target.value)}
                  maxLength={60}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
            )}
            <Button onClick={submit} disabled={busy} className="w-full">
              {busy ? "註冊中..." : "完成註冊"}
            </Button>
            <button onClick={() => setStep(1)} className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground">
              <ArrowLeft className="h-3 w-3" /> 改手機號
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-muted-foreground">
          已有帳號？<Link href="/login" className="text-primary hover:underline">登入</Link>
          <span className="mx-2">·</span>
          <Link href="/register" className="text-primary hover:underline">改用 Email 註冊</Link>
        </div>
      </div>
    </div>
  );
}
