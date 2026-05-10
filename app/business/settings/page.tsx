/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { BusinessProfileForm } from "@/components/business/profile-form";
import { KycUploader } from "@/components/business/kyc-uploader";
import { MerchantInfoForm } from "@/components/business/merchant-info-form";

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
      merchantInfo: true,
      kycStatus: true,
      kycRejectReason: true,
      displayName: true,
      email: true,
      phoneNumber: true,
    },
  });

  const info = (me?.merchantInfo as Record<string, unknown>) ?? {};

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">⚙️ 業者設定</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          商號 / 簡介 / 營業資訊 / 認證
        </p>
      </header>

      {me?.kycStatus === "REJECTED" && me?.kycRejectReason && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-bold text-destructive">⚠️ KYC 認證已退回</p>
          <p className="mt-1 text-destructive/80">{me.kycRejectReason}</p>
          <p className="mt-1 text-xs text-muted-foreground">請更新文件後重新提交審核。</p>
        </div>
      )}

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
        <h2 className="mb-3 text-lg font-bold">🏪 店家資訊</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          這些資訊會顯示在你的店家頁，幫助會員快速判斷是否符合需求。
        </p>
        <MerchantInfoForm
          initial={{
            businessHours: String(info.businessHours ?? ""),
            serviceArea: String(info.serviceArea ?? ""),
            address: String(info.address ?? ""),
            phone: String(info.phone ?? ""),
            line: String(info.line ?? ""),
            paymentMethods: Array.isArray(info.paymentMethods) ? info.paymentMethods as string[] : [],
            website: String(info.website ?? ""),
            mapUrl: String(info.mapUrl ?? ""),
          }}
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
