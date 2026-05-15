"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, MessageSquare, MailPlus, X, Lock } from "lucide-react";

export function ContactModalButton({
  adId,
  merchantId,
  contactPhone,
  contactLine,
  isAuthenticated,
}: {
  adId: string;
  merchantId: string;
  contactPhone?: string | null;
  contactLine?: string | null;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isPaid = !!(contactPhone || contactLine);

  function track() {
    fetch(`/api/business/ads/${adId}/contact`, { method: "POST", keepalive: true }).catch(() => null);
  }

  function openMsg() {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=/messages/new?to=${merchantId}`);
      return;
    }
    track();
    router.push(`/messages/new?to=${merchantId}&adId=${adId}`);
  }

  function lineHref(raw: string): string {
    const v = raw.trim();
    if (v.startsWith("http")) return v;
    if (v.startsWith("@")) return `https://line.me/R/ti/p/${encodeURIComponent(v)}`;
    return `https://line.me/R/ti/p/~${encodeURIComponent(v.replace(/^[~]/, ""))}`;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 py-3.5 text-base font-bold text-white shadow-md transition hover:from-rose-700 hover:to-rose-600 active:scale-[0.99]"
      >
        📞 聯絡店家
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="text-base font-bold">選擇聯絡方式</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                aria-label="關閉"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-2 p-4">
              {isPaid ? (
                <>
                  {contactPhone && (
                    <a
                      href={`tel:${contactPhone}`}
                      onClick={track}
                      className="flex items-center gap-3 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/10 p-3 transition hover:bg-emerald-500/20"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">電話 / 手機</p>
                        <p className="text-base font-bold tracking-wide">{contactPhone}</p>
                      </div>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400">點擊撥號</span>
                    </a>
                  )}

                  {contactLine && (
                    <a
                      href={lineHref(contactLine)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={track}
                      className="flex items-center gap-3 rounded-xl border-2 border-[#06C755]/50 bg-[#06C755]/10 p-3 transition hover:bg-[#06C755]/20"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#06C755] text-white">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">LINE</p>
                        <p className="text-base font-bold tracking-wide">{contactLine}</p>
                      </div>
                      <span className="text-xs text-[#06C755]">開啟 LINE</span>
                    </a>
                  )}

                  {/* 一律也顯示站內私訊作為次選 */}
                  <button
                    type="button"
                    onClick={openMsg}
                    className="flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition hover:bg-muted"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <MailPlus className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">站內私訊</p>
                      <p className="text-sm font-bold">傳訊息給店家（站內留紀錄）</p>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  {/* 免費帖：只能用站內私訊 */}
                  <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                    <Lock className="h-3.5 w-3.5" />
                    此店家為免費刊登，僅提供站內私訊
                  </div>

                  <button
                    type="button"
                    onClick={openMsg}
                    className="flex w-full items-center gap-3 rounded-xl border-2 border-primary/50 bg-primary/10 p-3 text-left transition hover:bg-primary/20"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <MailPlus className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">站內私訊</p>
                      <p className="text-base font-bold">傳訊息給店家</p>
                    </div>
                  </button>
                </>
              )}
            </div>

            {/* Footer 提醒 */}
            <p className="border-t bg-muted/40 px-5 py-2.5 text-center text-[11px] text-muted-foreground">
              {isPaid ? "請於營業時間聯絡，提及「JKForum」可獲優先服務" : "店家收到私訊後會主動回覆"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
