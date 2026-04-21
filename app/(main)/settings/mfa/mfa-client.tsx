"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, Copy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

interface Props {
  enabled: boolean;
  email: string;
}

export function MfaClient({ enabled: initialEnabled, email }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);

  // setup state
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  // disable state
  const [password, setPassword] = useState("");

  const startSetup = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/mfa/setup", { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "設定失敗");
      setQrUrl(data.qrDataUrl);
      setSecret(data.secret);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) return toast.error("請輸入 6 位數驗證碼");
    setLoading(true);
    try {
      const r = await fetch("/api/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "驗證失敗");
      toast.success("MFA 已啟用！");
      setEnabled(true);
      setBackupCodes(data.backupCodes || []);
      setQrUrl(null);
      setSecret(null);
      setCode("");
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    if (!password.trim()) return toast.error("請輸入密碼確認");
    if (!confirm("確定要停用 MFA？停用後帳號安全性將降低。")) return;
    setLoading(true);
    try {
      const r = await fetch("/api/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "停用失敗");
      toast.success("已停用 MFA");
      setEnabled(false);
      setPassword("");
      setBackupCodes(null);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (!backupCodes) return;
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("已複製到剪貼簿");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold">
          {enabled ? (
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
          ) : (
            <ShieldOff className="h-6 w-6 text-muted-foreground" />
          )}
          雙因素認證（MFA）
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          登入時除密碼外再額外輸入驗證碼，大幅提升帳號安全
        </p>
      </div>

      {enabled && !backupCodes && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="font-medium text-emerald-700 dark:text-emerald-400">
            ✅ MFA 已啟用
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            你的帳號受到雙因素認證保護。登入時除密碼外需額外輸入驗證碼。
          </p>

          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">停用 MFA</p>
            <Input
              type="password"
              placeholder="輸入密碼確認"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button variant="outline" onClick={disable} loading={loading}>
              停用 MFA
            </Button>
          </div>
        </div>
      )}

      {backupCodes && (
        <Alert variant="warning">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-bold">請妥善保存以下備用碼</p>
                <p className="text-sm">
                  若無法使用驗證 App，可用這些一次性備用碼登入。每組只能用一次，共 10 組。
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-md bg-background p-3 font-mono text-sm">
              {backupCodes.map((c) => (
                <div key={c}>{c}</div>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={copyBackupCodes}>
              <Copy className="mr-1.5 h-4 w-4" />
              複製全部
            </Button>
          </div>
        </Alert>
      )}

      {!enabled && !qrUrl && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div>
            <h3 className="font-semibold">啟用 MFA</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              請準備一款驗證 App（Google Authenticator、Authy、1Password 等）。
            </p>
          </div>
          <Button onClick={startSetup} loading={loading}>
            開始設定
          </Button>
        </div>
      )}

      {qrUrl && !enabled && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div>
            <h3 className="font-semibold">1. 掃描 QR Code</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              用驗證 App 掃描下方 QR Code，或手動輸入密鑰。
            </p>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="MFA QR Code"
            className="mx-auto w-48 rounded-lg border bg-white p-2"
          />

          {secret && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">手動密鑰：</p>
              <div className="rounded bg-muted p-2 font-mono text-xs break-all">
                {secret}
              </div>
              <p className="text-xs text-muted-foreground">帳號識別：{email}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-semibold">2. 輸入 App 產生的 6 位數驗證碼</h3>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                className="font-mono text-lg tracking-widest"
                inputMode="numeric"
              />
              <Button onClick={verifyCode} loading={loading}>
                確認啟用
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
