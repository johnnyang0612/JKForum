/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { db } from "@/lib/db";
import { ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { KycReviewActions } from "@/components/admin/kyc-review-actions";

export const dynamic = "force-dynamic";

export default async function AdminBusinessKycPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status ?? "PENDING";
  // PENDING = 有上傳文件且尚未核可；VERIFIED = 已核可
  const where: any = { userType: "BUSINESS" };
  if (status === "VERIFIED") where.merchantVerified = true;
  else if (status === "PENDING") {
    where.merchantVerified = false;
    where.merchantVerifiedDocs = { not: [] };
  } else if (status === "EMPTY") {
    where.merchantVerified = false;
    where.merchantVerifiedDocs = { equals: [] };
  }

  const list = await db.user.findMany({
    where,
    select: {
      id: true, merchantName: true, displayName: true, email: true, phoneNumber: true,
      merchantVerified: true, merchantVerifiedDocs: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ShieldCheck className="h-7 w-7 text-primary" /> 業者 KYC 審核
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          通過後業者獲得「認證徽章」並解鎖完整刊登權限
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {[
          { v: "PENDING", l: "待審" },
          { v: "VERIFIED", l: "已認證" },
          { v: "EMPTY", l: "未上傳" },
        ].map((s) => (
          <Link key={s.v} href={`?status=${s.v}`}
            className={`rounded-full px-3 py-1 text-xs ${
              status === s.v ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            }`}>
            {s.l}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">無資料</div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((u) => {
            const docs = (u.merchantVerifiedDocs as any[]) ?? [];
            return (
              <div key={u.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{u.merchantName ?? u.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.email} · {u.phoneNumber ?? "無手機"} · 註冊 {formatDate(u.createdAt)}
                    </p>
                  </div>
                  {u.merchantVerified && <span className="text-xs text-emerald-400">✓ 已認證</span>}
                </div>

                {docs.length === 0 ? (
                  <p className="mt-3 text-center text-xs text-muted-foreground">尚未上傳文件</p>
                ) : (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {docs.map((d: any, i: number) => (
                      <a key={i} href={d.url} target="_blank" rel="noreferrer" className="block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={d.url} alt={d.type} className="aspect-square w-full rounded object-cover" />
                        <p className="mt-1 text-center text-[10px] text-muted-foreground">{d.type}</p>
                      </a>
                    ))}
                  </div>
                )}

                {!u.merchantVerified && docs.length > 0 && (
                  <div className="mt-3">
                    <KycReviewActions userId={u.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
