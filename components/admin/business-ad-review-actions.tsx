"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RejectReasonDialog } from "@/components/admin/reject-reason-dialog";

export function BusinessAdReviewActions({ adId, status }: { adId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<null | "reject" | "remove">(null);

  async function call(action: string, reason?: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/business-ads/${adId}/${action}`, {
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
          <Button size="sm" onClick={() => call("approve")} disabled={busy}>通過</Button>
          <Button size="sm" variant="destructive" onClick={() => setDialog("reject")} disabled={busy}>退回</Button>
        </div>
      )}
      {status === "ACTIVE" && (
        <Button size="sm" variant="outline" onClick={() => setDialog("remove")} disabled={busy}>強制下架</Button>
      )}
      {!["PENDING", "ACTIVE"].includes(status) && <span className="text-xs text-muted-foreground">—</span>}

      <RejectReasonDialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onSubmit={(reason) => call(dialog === "remove" ? "remove" : "reject", reason)}
        type="ad"
      />
    </>
  );
}
