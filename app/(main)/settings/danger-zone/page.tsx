import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { DangerZonePanel } from "@/components/settings/danger-zone-panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "危險區" };

export default async function DangerZonePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const pending = await db.accountDeletionRequest.findFirst({
    where: { userId: session.user.id, executedAt: null, cancelledAt: null },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-destructive">危險區</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          帳號級的不可逆操作。請小心。
        </p>
      </div>
      <DangerZonePanel
        pendingDeletion={
          pending
            ? { scheduledAt: pending.scheduledAt.toISOString() }
            : null
        }
      />
    </div>
  );
}
