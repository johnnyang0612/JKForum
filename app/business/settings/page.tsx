/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { BusinessProfileForm } from "@/components/business/profile-form";
import { KycUploader } from "@/components/business/kyc-uploader";

export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      merchantName: true,
      merchantBio: true,
      merchantVerified: true,
      merchantVerifiedDocs: true,
      displayName: true,
      email: true,
      phoneNumber: true,
    },
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">⚙️ 業者設定</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          商號 / 簡介 / 認證
        </p>
      </header>

      <div className="rounded-2xl border bg-card p-6">
        <BusinessProfileForm
          initial={{
            merchantName: me?.merchantName ?? "",
            merchantBio: me?.merchantBio ?? "",
          }}
          verified={!!me?.merchantVerified}
        />
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <KycUploader
          initial={(me?.merchantVerifiedDocs as any[]) ?? []}
          verified={!!me?.merchantVerified}
        />
      </div>

      <div className="rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="font-bold text-foreground">📞 聯絡資訊（不可在後台修改，請至個人設定）</p>
        <ul className="mt-2 space-y-0.5">
          <li>顯示名稱：{me?.displayName}</li>
          <li>Email：{me?.email}</li>
          <li>手機：{me?.phoneNumber ?? "未填"}</li>
        </ul>
      </div>
    </div>
  );
}
