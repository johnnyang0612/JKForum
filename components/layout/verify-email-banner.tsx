"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { Mail, X } from "lucide-react";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export function VerifyEmailBanner() {
  const { data: session, status } = useSession();
  const { data } = useSWR(session?.user ? "/api/users/me" : null, fetcher);
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const v = sessionStorage.getItem("verifyBannerDismissed");
      if (v === "1") setDismissed(true);
    }
  }, []);

  if (status !== "authenticated") return null;
  if (!data?.success) return null;
  if (data.data?.emailVerified) return null;
  if (pathname?.startsWith("/verify-email")) return null;
  if (pathname?.startsWith("/login") || pathname?.startsWith("/register")) return null;
  if (dismissed) return null;

  return (
    <div className="sticky top-0 z-50 border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
      <div className="container-main flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <Mail className="h-4 w-4 flex-none" />
          <span>
            您的 Email 尚未驗證 — 暫時無法發文 / 回覆 / 打賞。
            <Link href="/verify-email" className="ml-2 font-bold underline hover:text-amber-500">
              立即驗證 →
            </Link>
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            sessionStorage.setItem("verifyBannerDismissed", "1");
          }}
          aria-label="關閉"
          className="flex-none rounded p-1 hover:bg-amber-500/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
