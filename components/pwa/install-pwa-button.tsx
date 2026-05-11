"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

// BeforeInstallPromptEvent 不在 lib.dom 預設 type 內，自行宣告
interface BIPEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISSED_KEY = "pwa_install_dismissed_at";
const DISMISS_DAYS = 14;

export function InstallPwaButton({ variant = "icon" }: { variant?: "icon" | "full" }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosVisible, setIosVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 已安裝判定
    if (window.matchMedia?.("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // 14 天內被使用者關過 → 不再彈
    try {
      const at = localStorage.getItem(DISMISSED_KEY);
      if (at && Date.now() - Number(at) < DISMISS_DAYS * 24 * 3600 * 1000) {
        setDismissed(true);
      }
    } catch { /* noop */ }

    // Chrome / Android
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt as EventListener);

    // iOS Safari: 沒 beforeinstallprompt，要手動顯示安裝提示
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !/(window as any).MSStream/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
    if (isIOS && isSafari) {
      setIosVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt as EventListener);
  }, []);

  function dismiss() {
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch { /* noop */ }
    setDismissed(true);
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "dismissed") dismiss();
    setDeferred(null);
  }

  if (installed || dismissed) return null;

  // iOS：彈底部說明條（無法 programmatic install）
  if (iosVisible && !deferred) {
    return (
      <div className="fixed bottom-20 left-2 right-2 z-40 rounded-lg border border-primary/30 bg-card/95 p-3 text-xs shadow-lg backdrop-blur safe-area-pb lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-sm">
        <div className="flex items-start gap-2">
          <Download className="h-4 w-4 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="font-bold">將 JKForum 加到主畫面</p>
            <p className="mt-0.5 text-muted-foreground">
              點下方分享 <span className="font-mono">⎙</span> → 加入主畫面
            </p>
          </div>
          <button onClick={dismiss} className="tap-target shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // 桌面/Android
  if (!deferred) return null;

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={install}
        title="安裝為 App"
        className="tap-target flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
        aria-label="安裝為 App"
      >
        <Download className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={install}
      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
    >
      <Download className="h-4 w-4" /> 安裝 App
    </button>
  );
}
