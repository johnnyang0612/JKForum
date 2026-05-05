import { db } from "@/lib/db";
import { Tags } from "lucide-react";
import { BusinessTagsManager } from "@/components/admin/business-tags-manager";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "業者標籤管理" };

export default async function AdminBusinessTagsPage() {
  const tags = await db.businessAdTag.findMany({
    orderBy: [
      { isUnlimited: "desc" },
      { category: "asc" },
      { sortOrder: "asc" },
      { name: "asc" },
    ],
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Tags className="h-7 w-7 text-primary" /> 業者標籤管理
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          管理業者刊登時可選的「配合項目」標籤字典；「不限」永遠在最前。
        </p>
      </header>

      <BusinessTagsManager initial={tags} />
    </div>
  );
}
