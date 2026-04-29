/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushButton() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (!ok) return;

    setPermission(Notification.permission);

    // 註冊 SW + 檢查訂閱狀態
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, []);

  async function subscribe() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast.error("您拒絕了通知權限");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      // 取公鑰
      const keyRes = await fetch("/api/push/subscribe");
      const { publicKey } = await keyRes.json();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json: any = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          ua: navigator.userAgent.slice(0, 200),
        }),
      });
      const r = await res.json();
      if (r.success) {
        setSubscribed(true);
        toast.success("已啟用推播通知 🔔");
      } else {
        toast.error(r.error || "訂閱失敗");
      }
    } catch (e: any) {
      toast.error(e.message || "訂閱失敗");
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast.success("已關閉推播通知");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <BellOff className="h-4 w-4" />
        瀏覽器不支援
      </Button>
    );
  }

  if (permission === "denied") {
    return (
      <Button variant="outline" disabled className="gap-2 text-rose-400">
        <BellOff className="h-4 w-4" />
        已封鎖通知
      </Button>
    );
  }

  if (subscribed) {
    return (
      <Button variant="outline" onClick={unsubscribe} disabled={busy} className="gap-2">
        <BellRing className="h-4 w-4 text-emerald-400" />
        {busy ? "..." : "已啟用通知（點擊關閉）"}
      </Button>
    );
  }

  return (
    <Button onClick={subscribe} disabled={busy} className="gap-2">
      <Bell className="h-4 w-4" />
      {busy ? "啟用中..." : "啟用推播通知"}
    </Button>
  );
}
