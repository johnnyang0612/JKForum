/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdEditorForm } from "@/components/business/ad-editor-form";

export const dynamic = "force-dynamic";

export default async function NewAdPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const [forums, regionRows, wallet] = await Promise.all([
    db.forum.findMany({
      where: { allowPaidListing: true, isVisible: true },
      select: { id: true, name: true, slug: true, defaultAdTier: true, themeCategoriesJson: true, forceThemeCategory: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.region.findMany({
      where: { isActive: true },
      orderBy: [{ city: "asc" }, { sortOrder: "asc" }],
    }),
    db.businessWallet.findUnique({ where: { merchantId: session.user.id } }),
  ]);

  // group regions: { city: [districts] }
  const regions: Record<string, string[]> = {};
  for (const r of regionRows) {
    (regions[r.city] ||= []).push(r.district);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header>
        <h1 className="text-2xl font-bold">📝 發布新廣告</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          錢包餘額 NT$ {(wallet?.balance ?? 0).toLocaleString()}
        </p>
      </header>

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
          }))}
          regions={regions}
          balance={wallet?.balance ?? 0}
        />
      )}
    </div>
  );
}
