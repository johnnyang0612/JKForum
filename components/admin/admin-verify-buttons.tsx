"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Phone } from "lucide-react";

export function AdminVerifyButtons({
  userId,
  emailVerified,
  smsVerified,
}: {
  userId: string;
  emailVerified: boolean;
  smsVerified: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function force(kind: "email" | "sms") {
    setBusy(kind);
    try {
      const method = kind === "email" ? "POST" : "PUT";
      const res = await fetch("/api/admin/email-verify", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const j = await res.json();
      if (j.success) {
        toast.success(`${kind === "email" ? "Email" : "SMS"} 已強制驗證`);
        router.refresh();
      } else toast.error(j.error);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex justify-center gap-1">
      {!emailVerified && (
        <button
          type="button"
          disabled={busy === "email"}
          onClick={() => force("email")}
          className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
          title="強制標記 Email 為已驗證"
        >
          <Mail className="mr-1 inline h-3 w-3" />
          {busy === "email" ? "..." : "Email"}
        </button>
      )}
      {!smsVerified && (
        <button
          type="button"
          disabled={busy === "sms"}
          onClick={() => force("sms")}
          className="rounded bg-blue-500/20 px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/30 disabled:opacity-50"
          title="強制標記 SMS 為已驗證"
        >
          <Phone className="mr-1 inline h-3 w-3" />
          {busy === "sms" ? "..." : "SMS"}
        </button>
      )}
      {emailVerified && smsVerified && (
        <span className="text-xs text-muted-foreground">已完成</span>
      )}
    </div>
  );
}
