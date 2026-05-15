"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, X } from "lucide-react";

/**
 * 前台「發帖」CTA — 取代原本「我是業者/刊登廣告」按鈕。
 * 店家總覽是用戶端瀏覽頁；前台應引導發帖（論壇文章），
 * 刊登廣告是業者後台動作，只在 /business 內出現。
 *
 * 邏輯：
 *  - 未登入 → /login?callbackUrl=/business/ads/new
 *  - 未電話認證 → 彈出二次認證提示 → /verify-phone?next=/business/ads/new
 *  - 已通過 → /business/ads/new
 */
export function PostAdCta({
  isAuthenticated,
  smsVerified,
}: {
  isAuthenticated: boolean;
  smsVerified: boolean;
}) {
  const router = useRouter();
  const [showGate, setShowGate] = useState(false);

  function handleClick() {
    if (!isAuthenticated) {
      router.push("/login?callbackUrl=/business/ads/new");
      return;
    }
    if (!smsVerified) {
      setShowGate(true);
      return;
    }
    router.push("/business/ads/new");
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center justify-center rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-sm hover:bg-primary/20 active:scale-[0.98] sm:px-3 sm:py-1.5 sm:text-xs"
      >
        📣 我要刊登
      </button>

      {showGate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setShowGate(false)}
        >
          <div
            className="relative mx-3 w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowGate(false)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              aria-label="關閉"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-amber-500/10 p-4">
                <ShieldAlert className="h-10 w-10 text-amber-400" />
              </div>
              <h2 className="mt-4 text-xl font-bold">需要二次認證</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                為了確保社群品質與防止詐騙，發帖前需完成手機 SMS 驗證。
                <br />
                完成後即可直接發帖。
              </p>

              <div className="mt-6 flex w-full gap-2">
                <button
                  type="button"
                  onClick={() => setShowGate(false)}
                  className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm hover:bg-muted"
                >
                  稍後再說
                </button>
                <button
                  type="button"
                  onClick={() => {
                    router.push(
                      "/verify-phone?next=" + encodeURIComponent("/business/ads/new")
                    );
                  }}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                >
                  前往認證
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
