"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RejectReasonDialog } from "@/components/admin/reject-reason-dialog";

export function KycReviewActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showReject, setShowReject] = useState(false);

  async function call(action: "approve" | "reject", reason?: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/business-kyc/${userId}/${action}`, {
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
      <div className="flex gap-2">
        <Button size="sm" onClick={() => call("approve")} disabled={busy} className="flex-1">
          通過認證
        </Button>
        <Button size="sm" variant="destructive" disabled={busy}
          onClick={() => setShowReject(true)} className="flex-1">退回</Button>
      </div>
      <RejectReasonDialog
        open={showReject}
        onClose={() => setShowReject(false)}
        onSubmit={(reason) => call("reject", reason)}
        type="kyc"
      />
    </>
  );
}
