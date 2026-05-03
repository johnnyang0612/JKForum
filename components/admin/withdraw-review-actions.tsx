"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RejectReasonDialog } from "@/components/admin/reject-reason-dialog";

export function WithdrawReviewActions({ wrId, status }: { wrId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showReject, setShowReject] = useState(false);

  async function call(action: string, reason?: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/withdrawals/${wrId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const j = await res.json();
      if (j.success) { toast.success("OK"); router.refresh(); }
      else toast.error(j.error);
    } finally { setBusy(false); }
  }

  return (
    <>
      {status === "PENDING" && (
        <div className="flex flex-wrap justify-center gap-1">
          <Button size="sm" onClick={() => call("approve")} disabled={busy}>核准</Button>
          <Button size="sm" variant="destructive" onClick={() => setShowReject(true)} disabled={busy}>退回</Button>
        </div>
      )}
      {status === "APPROVED" && (
        <Button size="sm" onClick={() => {
          if (confirm("確認已撥款？")) call("paid");
        }} disabled={busy}>標記已撥款</Button>
      )}
      {!["PENDING", "APPROVED"].includes(status) && <span className="text-xs text-muted-foreground">—</span>}

      <RejectReasonDialog
        open={showReject}
        onClose={() => setShowReject(false)}
        onSubmit={(reason) => call("reject", reason)}
        type="withdraw"
      />
    </>
  );
}
