/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdEditorForm } from "@/components/business/ad-editor-form";

export const dynamic = "force-dynamic";

export default async function NewAdPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const [forums, regionRows, wallet, me] = await Promise.all([
    db.forum.findMany({
      where: { allowPaidListing: true, isVisible: true },
      select: {
        id: true, name: true, slug: true, defaultAdTier: true,
        themeCategoriesJson: true, forceThemeCategory: true,
        rating: true, ageGateEnabled: true,
        category: { select: { id: true, name: true, sortOrder: true } },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    }),
    db.region.findMany({
      where: { isActive: true },
      orderBy: [{ city: "asc" }, { sortOrder: "asc" }],
    }),
    db.businessWallet.findUnique({ where: { merchantId: session.user.id } }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { merchantVerified: true, kycStatus: true, kycRejectReason: true },
    }),
  ]);

  // group regions: { city: [districts] }
  const regions: Record<string, string[]> = {};
  for (const r of regionRows) {
    (regions[r.city] ||= []).push(r.district);
  }

  const hasR18Forum = forums.some((f) => f.rating === "R18" || f.ageGateEnabled);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header>
        <h1 className="text-2xl font-bold">📝 發布新廣告</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          錢包餘額 NT$ {(wallet?.balance ?? 0).toLocaleString()}
        </p>
      </header>

      {/* R18 認證提示：未通過 KYC + 有 R18 板區 → 警示 */}
      {hasR18Forum && !me?.merchantVerified && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-4 text-sm">
          <p className="font-bold text-rose-400">🔞 R18 版區需 KYC 認證</p>
          <p className="mt-1 text-rose-300/90">
            刊登到 R18 版區（標記為 18+ 的看板）必須先通過業者 KYC 認證。
            {me?.kycStatus === "REJECTED" && me?.kycRejectReason && (
              <span className="mt-1 block text-xs">退回原因：{me.kycRejectReason}</span>
            )}
          </p>
          <a href="/business/settings"
            className="mt-2 inline-flex items-center rounded bg-rose-500 px-3 py-1.5 text-xs text-white hover:bg-rose-600">
            {me?.kycStatus === "REJECTED" ? "重新上傳 KYC 文件" : "前往上傳 KYC 文件"}
          </a>
        </div>
      )}

      {forums.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          目前尚無開放付費刊登的版區<br />
          請聯絡管理員開通
        </div>
      ) : (
        <AdEditorForm
          forums={forums.map((f) => ({
            id: f.id,
            name: f.name,
            defaultTier: f.defaultAdTier ?? "FREE",
            themes: (f.themeCategoriesJson as string[] | null) ?? [],
            forceTheme: f.forceThemeCategory,
            categoryName: f.category?.name,
            isR18: f.rating === "R18" || f.ageGateEnabled,
          }))}
          regions={regions}
          balance={wallet?.balance ?? 0}
          merchantVerified={!!me?.merchantVerified}
        />
      )}
    </div>
  );
}
